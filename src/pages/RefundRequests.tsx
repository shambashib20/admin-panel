import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import type { CancellationRequestStatus, RefundRequest } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { Modal } from '@/components/Modal'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtAmount(val: string | number) {
  return `₹${parseFloat(String(val)).toFixed(0)}`
}

type Tone = 'neutral' | 'success' | 'danger' | 'pending' | 'accent'

const STATUS_TONE: Record<CancellationRequestStatus, Tone> = {
  pending: 'neutral',
  admin_pending_money: 'pending',
  admin_pending_wallet: 'accent',
  admin_approved: 'success',
  admin_rejected: 'danger',
  refunded: 'success',
  credited: 'success',
  timing_changed: 'neutral',
}

const STATUS_LABEL: Record<CancellationRequestStatus, string> = {
  pending: 'Pending',
  admin_pending_money: 'Money Refund (Queue)',
  admin_pending_wallet: 'Wallet Credit (Queue)',
  admin_approved: 'Approved',
  admin_rejected: 'Rejected',
  refunded: 'Refunded',
  credited: 'Credited',
  timing_changed: 'Timing Changed',
}

// ─── Reject modal ────────────────────────────────────────────────────────────

function RejectModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) setReason('')
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="Reject Request">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Rejection reason (optional — dikhega user ko nahi, admin ke liye reference):
        </p>
        <textarea
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent"
          rows={3}
          placeholder="e.g. Duplicate request, already processed..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

type FilterTab = 'pending' | 'all'

export function RefundRequests() {
  const [filter, setFilter] = useState<FilterTab>('pending')
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Approve
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<RefundRequest | null>(null)
  const [rejecting, setRejecting] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listRefundRequests(filter)
      setRequests(res.data.requests)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async (req: RefundRequest) => {
    if (!confirm(`Approve ₹${parseFloat(req.amount).toFixed(0)} ${req.status === 'admin_pending_wallet' ? 'wallet credit' : 'money refund'} for ${req.userName ?? req.userId}?`)) return
    setApprovingId(req.id)
    try {
      await adminApi.approveRefundRequest(req.id)
      await fetchRequests()
    } catch (e: any) {
      alert(e.message ?? 'Approve failed')
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    setRejecting(true)
    try {
      await adminApi.rejectRefundRequest(rejectTarget.id, reason || undefined)
      setRejectTarget(null)
      await fetchRequests()
    } catch (e: any) {
      alert(e.message ?? 'Reject failed')
    } finally {
      setRejecting(false)
    }
  }

  const actionable = (r: RefundRequest) =>
    r.status === 'admin_pending_money' || r.status === 'admin_pending_wallet'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text">Refund Requests</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Cancellation refund queue — approve karega toh wallet credit / money refund process hoga
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'all'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-accent text-white'
                : 'border border-border text-text-secondary hover:bg-surface-alt'
            }`}
          >
            {tab === 'pending' ? 'Pending Action' : 'All Requests'}
          </button>
        ))}
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="ml-auto rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-50"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">User</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Deduction</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Net Refund</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">UPI ID</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">By</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Created</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-text-faint">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-text-faint">
                    {filter === 'pending' ? 'Koi pending request nahi hai 🎉' : 'No requests found'}
                  </td>
                </tr>
              )}
              {!loading &&
                requests.map((req) => {
                  const gross = parseFloat(req.amount)
                  const deduction = req.deductionAmount
                  const net = Math.max(0, gross - deduction)
                  const isApproving = approvingId === req.id

                  return (
                    <tr
                      key={req.id}
                      className="border-b border-border last:border-0 hover:bg-surface-alt/50"
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">{req.userName ?? '—'}</p>
                        <p className="text-xs text-text-faint font-mono">{req.userId.slice(0, 8)}…</p>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-text">{fmtAmount(req.amount)}</td>

                      {/* Deduction */}
                      <td className="px-4 py-3">
                        {deduction > 0 ? (
                          <span className="text-danger">−{fmtAmount(deduction)}</span>
                        ) : (
                          <span className="text-text-faint">—</span>
                        )}
                      </td>

                      {/* Net */}
                      <td className="px-4 py-3 font-semibold text-text">{fmtAmount(net)}</td>

                      {/* UPI */}
                      <td className="px-4 py-3">
                        {req.upiId ? (
                          <span className="font-mono text-xs text-text">{req.upiId}</span>
                        ) : (
                          <span className="text-text-faint text-xs">
                            {req.status === 'admin_pending_money' ? 'Not provided (auto-queued)' : '—'}
                          </span>
                        )}
                      </td>

                      {/* Initiated by */}
                      <td className="px-4 py-3">
                        <Badge tone={req.initiatedBy === 'user' ? 'pending' : 'neutral'}>
                          {req.initiatedBy}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[req.status]}>
                          {STATUS_LABEL[req.status]}
                        </Badge>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                        {fmt(req.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {actionable(req) ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isApproving}
                              className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {isApproving ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setRejectTarget(req)}
                              disabled={isApproving}
                              className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-faint">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer when "all" tab is active */}
      {!loading && filter === 'all' && requests.length > 0 && (
        <p className="text-xs text-text-faint text-right">
          {requests.length} total request{requests.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Reject modal */}
      <RejectModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        loading={rejecting}
      />
    </div>
  )
}

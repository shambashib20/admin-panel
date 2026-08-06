import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import type { AstrologerListItem, PaginationMeta, VerificationStatus } from '@/lib/types'
import { Pagination } from '@/components/Pagination'
import { VerificationBadge } from '@/components/VerificationBadge'
import { AstrologerDetailModal } from '@/components/AstrologerDetailModal'

const tabs: { label: string; value: VerificationStatus | '' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: '' },
]

export function Astrologers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [astrologers, setAstrologers] = useState<AstrologerListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [selected, setSelected] = useState<AstrologerListItem | null>(null)

  const status = (searchParams.get('status') as VerificationStatus | null) ?? 'pending'
  const search = searchParams.get('search') ?? undefined
  const page = Number(searchParams.get('page') ?? 1)

  const load = () => {
    setLoading(true)
    adminApi
      .listAstrologers({ search, status: status || undefined, page })
      .then((res) => {
        setAstrologers(res.astrologers)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('Astrologers load nahi ho paaye.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, status, page])

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParam('status', tab.value || undefined)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === tab.value
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateParam('search', searchInput || undefined)
          }}
          className="min-w-[220px] flex-1 max-w-xs"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or phone…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </form>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium">Experience</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  Loading…
                </td>
              </tr>
            ) : astrologers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  No astrologers found.
                </td>
              </tr>
            ) : (
              astrologers.map((a) => (
                <tr key={a.id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {a.avatarUrl || a.photoUrl ? (
                        <img
                          src={a.avatarUrl ?? a.photoUrl ?? ''}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-xs text-text-secondary">
                          {a.name?.[0] ?? '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text">{a.name ?? 'Unnamed'}</p>
                        <p className="font-mono text-xs text-text-faint">{a.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{a.experience ?? 0} yrs</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {a.rating ?? '0.00'} ({a.totalReviews ?? 0})
                  </td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={a.verificationStatus} />
                  </td>
                  <td className="px-4 py-3 text-text-faint">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(a)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent/40 hover:text-accent"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {meta && <Pagination meta={meta} onPageChange={(p) => updateParam('page', String(p))} />}
      </div>

      {selected && (
        <AstrologerDetailModal
          astrologer={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </div>
  )
}

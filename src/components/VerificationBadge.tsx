import type { VerificationStatus } from '@/lib/types'

const config: Record<VerificationStatus, { label: string; tone: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    tone: 'text-pending bg-pending-soft border-pending/20',
    icon: (
      // waxing half-moon — decision not yet made
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M6 1a5 5 0 0 1 0 10z" fill="currentColor" />
      </svg>
    ),
  },
  approved: {
    label: 'Approved',
    tone: 'text-success bg-success-soft border-success/20',
    icon: (
      // full moon — complete, verified
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5" fill="currentColor" />
      </svg>
    ),
  },
  rejected: {
    label: 'Rejected',
    tone: 'text-danger bg-danger-soft border-danger/20',
    icon: (
      // new moon / void — nothing approved
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="2.3" y1="9.7" x2="9.7" y2="2.3" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { label, tone, icon } = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {icon}
      {label}
    </span>
  )
}

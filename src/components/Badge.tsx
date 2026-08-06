import type { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'danger' | 'pending' | 'accent'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-text-secondary border-border',
  success: 'bg-success-soft text-success border-success/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  pending: 'bg-pending-soft text-pending border-pending/20',
  accent: 'bg-accent-soft text-accent border-accent/20',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

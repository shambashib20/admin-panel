import type { ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className={`w-full ${width} max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-faint hover:bg-surface-alt hover:text-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

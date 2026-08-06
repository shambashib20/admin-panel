import type { PaginationMeta } from '@/lib/types'

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}) {
  if (meta.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-text-faint">
        {meta.total} total · page {meta.page} of {meta.totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary disabled:opacity-40 enabled:hover:bg-surface-alt"
        >
          Previous
        </button>
        <button
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary disabled:opacity-40 enabled:hover:bg-surface-alt"
        >
          Next
        </button>
      </div>
    </div>
  )
}

import { useAuth } from '@/lib/auth-context'

export function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="font-display text-lg font-semibold text-text">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-text">{user?.name ?? user?.email}</p>
          <p className="text-xs text-text-faint">Admin</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
        >
          Log out
        </button>
      </div>
    </header>
  )
}

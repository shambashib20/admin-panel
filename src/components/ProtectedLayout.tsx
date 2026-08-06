import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const titleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/astrologers': 'Astrologers',
  '/posts': 'Posts',
}

export function ProtectedLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text-secondary">
        Loading…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-bg text-center">
        <p className="font-display text-xl font-semibold text-text">Not an admin account</p>
        <p className="max-w-sm text-sm text-text-secondary">
          Yeh number admin role mein nahi hai. Kisi admin account se login karo.
        </p>
      </div>
    )
  }

  const path = '/' + (location.pathname.split('/')[1] ?? '')
  const title = titleMap[path] ?? 'Astrobook Admin'

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.adminLogin(email, password)
      const { user: loggedInUser, accessToken, refreshToken } = res.data
      login(loggedInUser, accessToken, refreshToken)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold text-text">Astrobook</p>
          <p className="mt-1 text-sm text-text-secondary">Admin console</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@astrobook.com"
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}

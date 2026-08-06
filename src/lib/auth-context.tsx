import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from './api'
import { tokenStore } from './token-store'
import type { User } from './types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hasToken = !!tokenStore.getAccessToken()
    if (!hasToken) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = (nextUser: User, accessToken: string, refreshToken: string) => {
    tokenStore.setTokens(accessToken, refreshToken)
    setUser(nextUser)
  }

  const logout = () => {
    tokenStore.clear()
    setUser(null)
    authApi.logoutAll().catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

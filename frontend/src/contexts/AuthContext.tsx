import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import * as authApi from '../lib/auth'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Refresh session on mount (reads httpOnly cookies server-side)
  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const res = await authApi.refresh()
      if (res?.user) {
        setUser(res.user)
        return res.user
      }
      setUser(null)
      return null
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!mounted) return
      setLoading(true)
      await refresh()
      if (mounted) setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setUser(res.user)
    return res.user
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const res = await authApi.register(email, password)
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
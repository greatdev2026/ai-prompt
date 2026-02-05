import type { User } from '../types'

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') ?? ''

async function parseJsonSafe(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function register(email: string, password: string): Promise<{ user: User }> {
  if (!BASE) throw new Error('Backend not configured (VITE_BACKEND_URL)')
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const data = await parseJsonSafe(res)
    throw new Error((data && (data as any).error) || res.statusText || 'Registration failed')
  }
  return (await res.json()) as { user: User }
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  if (!BASE) throw new Error('Backend not configured (VITE_BACKEND_URL)')
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const data = await parseJsonSafe(res)
    throw new Error((data && (data as any).error) || res.statusText || 'Login failed')
  }
  return (await res.json()) as { user: User }
}

export async function refresh(): Promise<{ user: User } | null> {
  if (!BASE) return null
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  })
  if (!res.ok) {
    return null
  }
  return (await res.json()) as { user: User }
}

export async function logout(): Promise<void> {
  if (!BASE) return
  await fetch(`${BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' })
}
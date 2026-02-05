import React, { FormEvent, useState } from 'react'

type Props = {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
  loading?: boolean
  showToast: (message: string, kind?: 'info' | 'success' | 'error') => void
  onSuccess?: () => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASS = 8

export default function AuthForm({ onLogin, onRegister, loading = false, showToast, onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const validate = () => {
    if (!EMAIL_RE.test(email)) {
      showToast('Enter a valid email address', 'error')
      return false
    }
    if (password.length < MIN_PASS) {
      showToast(`Password must be at least ${MIN_PASS} characters`, 'error')
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password)
        showToast('Logged in', 'success')
      } else {
        await onRegister(email.trim(), password)
        showToast('Account created', 'success')
      }
      setEmail('')
      setPassword('')
      if (onSuccess) onSuccess()
    } catch (err: any) {
      showToast(String(err?.message ?? err), 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3">
        <label htmlFor="auth-email" className="sr-only">Email</label>
        <input
          id="auth-email"
          type="email"
          inputMode="email"
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />

        <label htmlFor="auth-password" className="sr-only">Password</label>
        <input
          id="auth-password"
          type="password"
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          minLength={MIN_PASS}
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            disabled={loading}
          >
            {mode === 'login' ? 'Login' : 'Register'}
          </button>

          <button
            type="button"
            className="ml-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
            disabled={loading}
          >
            {mode === 'login' ? 'Switch to Register' : 'Switch to Login'}
          </button>
        </div>
      </div>
    </form>
  )
}
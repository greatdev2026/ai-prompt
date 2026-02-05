import React, { createContext, useContext, useState } from 'react'

type Toast = { id: string; message: string; kind?: 'info' | 'success' | 'error' }
type ToastContextValue = { toasts: Toast[]; showToast: (msg: string, kind?: Toast['kind']) => void; removeToast: (id: string) => void }

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, kind: Toast['kind'] = 'info') => {
    const id = cryptoRandomId()
    const t = { id, message, kind }
    setToasts((s) => [...s, t])
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000)
  }

  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id))

  return <ToastContext.Provider value={{ toasts, showToast, removeToast }}>{children}</ToastContext.Provider>
}

function cryptoRandomId() {
  try {
    const a = crypto.getRandomValues(new Uint32Array(2))
    return `${a[0].toString(36)}${a[1].toString(36)}`
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}
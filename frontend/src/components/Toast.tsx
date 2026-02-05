import React from 'react'
import { useToast } from '../contexts/ToastContext'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  return (
    <div aria-live="polite" className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`max-w-sm rounded-md px-3 py-2 text-sm shadow ${
            t.kind === 'error'
              ? 'bg-red-600 text-white'
              : t.kind === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="ml-2 text-xs opacity-80">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
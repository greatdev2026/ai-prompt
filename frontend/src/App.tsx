import React, { useEffect, useMemo, useState } from 'react'
import PromptInput from './components/PromptInput'
import MessageList from './components/MessageList'
import AuthForm from './components/AuthForm'
import Modal from './components/Modal'
import ToastContainer from './components/Toast'
import { ToastProvider, useToast } from './contexts/ToastContext'
import type { Message, User } from './types'
import * as api from './lib/api'
import * as auth from './lib/auth'
import * as backup from './lib/storage'

function AppInner() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const { showToast } = useToast()
  const count = useMemo(() => messages.length, [messages])

  useEffect(() => {
    if (user) {
      try {
        backup.saveForUser(user.id, messages)
      } catch {}
    }
  }, [messages, user])

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        setLoading(true)
        const res = await auth.refresh()
        if (res && mounted) {
          setUser(res.user)
          const server = await api.fetchHistory()
          if (!mounted) return

          if (server && server.length > 0) {
            setMessages(server)
          } else {
            const local = backup.loadForUser(res.user.id)
            if (local && Array.isArray(local) && local.length > 0) {
              showToast('Found local backup — syncing to server...', 'info')
              for (const item of local) {
                try {
                  if (item && item.prompt) {
                    // eslint-disable-next-line no-await-in-loop
                    await api.postPrompt(String(item.prompt))
                  }
                } catch (err: any) {
                  console.warn('sync item failed', err)
                }
              }
              const reloaded = await api.fetchHistory()
              if (mounted) setMessages(reloaded)
            } else {
              setMessages([])
            }
          }
        } else {
          setMessages([])
        }
      } catch (err: any) {
        console.warn('Init error', err)
        setMessages([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async () => {
    const prompt = input.trim()
    if (!prompt) return

    if (!user) {
      showToast('Please log in to submit prompts', 'info')
      setShowAuthModal(true)
      return
    }

    setError(null)
    setLoading(true)
    setInput('')

    // Add optimistic placeholder while request is in-flight
    const placeholder: Message = {
      id: cryptoRandomId(),
      prompt,
      response: '…',
      createdAt: new Date().toISOString()
    }
    //setMessages((m) => [...m, placeholder])

    try {
      const result = await api.postPrompt(prompt)
      // Replace placeholder with server result only on success
      setMessages((prev) => prev.map((it) => (it.id === placeholder.id ? result : it)))
    } catch (err: any) {
      // Remove the optimistic placeholder on error (do NOT keep an error message in history)
      //setMessages((prev) => prev.filter((it) => it.id !== placeholder.id))

      const msg = String(err?.message ?? err)
      setError(msg)
      showToast(msg, 'error')
      console.warn('postPrompt failed:', msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!user) {
      showToast('Please log in to clear history', 'info')
      setShowAuthModal(true)
      return
    }
    setError(null)
    try {
      await api.clearRemoteHistory()
      setMessages([])
      backup.clearForUser(user.id)
      showToast('History cleared', 'success')
    } catch (err: any) {
      showToast(String(err?.message ?? err), 'error')
    }
  }

  const handleRegister = async (email: string, password: string) => {
    setAuthLoading(true)
    setError(null)
    try {
      const data = await auth.register(email, password)
      setUser(data.user)
      setShowAuthModal(false)
      showToast('Registered and signed in', 'success')
      const remote = await api.fetchHistory()
      setMessages(remote)
    } catch (err: any) {
      setError(String(err?.message ?? err))
      showToast(String(err?.message ?? err), 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true)
    setError(null)
    try {
      const data = await auth.login(email, password)
      setUser(data.user)
      setShowAuthModal(false)
      showToast('Logged in', 'success')
      const remote = await api.fetchHistory()
      setMessages(remote)
    } catch (err: any) {
      setError(String(err?.message ?? err))
      showToast(String(err?.message ?? err), 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await auth.logout()
    } catch (err) {
      console.warn('logout error', err)
    } finally {
      setUser(null)
      setMessages([])
      showToast('Logged out', 'info')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header: app title and auth controls (separated from prompt) */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">AI Prompt</h1>
            <p className="text-sm text-gray-600">Enter prompts and view saved responses.</p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-sm text-gray-700">Signed in as {user.email}</div>
                <button onClick={handleLogout} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Sign in / Register
              </button>
            )}
          </div>
        </header>

        {/* PROMPT CARD (full width, prominent) */}
        <div className="mb-6 rounded-xl bg-white border border-gray-200 p-6 shadow">
          <div className="mb-3">
            <p className="text-sm text-gray-600">Enter a prompt and get AI responses. Press Enter or click Send.</p>
          </div>

          <div className="mb-4">
            <PromptInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={loading || authLoading} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!user) {
                  showToast('Please sign in to submit prompts', 'info')
                  setShowAuthModal(true)
                  return
                }
                handleSubmit()
              }}
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
              aria-disabled={loading || authLoading}
            >
              Send
            </button>

            <button
              onClick={() => {
                if (!user) {
                  setShowAuthModal(true)
                  showToast('Please sign in to save history', 'info')
                } else {
                  handleClear()
                }
              }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear History
            </button>
          </div>
        </div>

        {/* HISTORY CARD (below prompt) */}
        <div className="rounded-lg bg-white border border-gray-200 p-4 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">History</h2>
            <div className="text-sm text-gray-600">Count: {count}</div>
          </div>

          <div className="max-h-[70vh] overflow-auto scrollbar-thin">
            {user ? <MessageList items={messages} /> : <div className="text-gray-600">Sign in to view and save your prompt history.</div>}
          </div>
        </div>
      </div>

      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Sign in / Register">
        <AuthForm onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} showToast={showToast} onSuccess={() => setShowAuthModal(false)} />
      </Modal>

      <ToastContainer />
    </main>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}

function cryptoRandomId() {
  try {
    const a = crypto.getRandomValues(new Uint32Array(2))
    return `${a[0].toString(36)}${a[1].toString(36)}`
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}
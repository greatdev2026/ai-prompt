import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { Message } from '../types'
import * as api from '../lib/api'
import { useAuth } from './AuthContext'
import * as backup from '../lib/storage'

type MessagesContextValue = {
  messages: Message[]
  loading: boolean
  fetchHistory: () => Promise<void>
  postPrompt: (prompt: string) => Promise<void>
  clearHistory: () => Promise<void>
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined)

export function useMessages() {
  const ctx = useContext(MessagesContext)
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider')
  return ctx
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  // Persist backup when messages or user changes
  useEffect(() => {
    if (user) {
      try {
        backup.saveForUser(user.id, messages)
      } catch {
        /* ignore */
      }
    }
  }, [messages, user])

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setMessages([])
      return
    }
    setLoading(true)
    try {
      const server = await api.fetchHistory()
      setMessages(server || [])
    } catch (err) {
      // Keep in-memory messages untouched (we don't inject failed placeholders here)
      console.warn('fetchHistory failed', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // When user changes, load their history (or clear)
  useEffect(() => {
    if (!user) {
      setMessages([])
      return
    }

    let mounted = true
    ;(async () => {
      await fetchHistory()
      // if server empty, attempt to sync local backup (optional policy)
      if (!mounted) return
      try {
        const local = backup.loadForUser(user.id)
        if (local && Array.isArray(local) && local.length > 0) {
          // simple strategy: post local prompts that don't exist on server
          // (This example keeps it simple; production should dedupe by some ID or offer confirm.)
          for (const item of local) {
            if (item && item.prompt) {
              // eslint-disable-next-line no-await-in-loop
              await api.postPrompt(String(item.prompt))
            }
          }
          await fetchHistory()
        }
      } catch (err) {
        console.warn('sync local backup failed', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user, fetchHistory])

  const postPrompt = useCallback(
    async (prompt: string) => {
      if (!user) throw new Error('Not authenticated')
      // optimistic placeholder
      const placeholder: Message = {
        id: `opt-${Date.now().toString(36)}`,
        prompt,
        response: '…',
        createdAt: new Date().toISOString()
      }
      setMessages((s) => [...s, placeholder])
      try {
        const result = await api.postPrompt(prompt)
        setMessages((prev) => prev.map((it) => (it.id === placeholder.id ? result : it)))
      } catch (err) {
        // remove placeholder on failure
        setMessages((prev) => prev.filter((it) => it.id !== placeholder.id))
        throw err
      }
    },
    [user]
  )

  const clearHistory = useCallback(async () => {
    if (!user) throw new Error('Not authenticated')
    await api.clearRemoteHistory()
    setMessages([])
    backup.clearForUser(user.id)
  }, [user])

  const value = useMemo(
    () => ({ messages, loading, fetchHistory, postPrompt, clearHistory }),
    [messages, loading, fetchHistory, postPrompt, clearHistory]
  )

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}
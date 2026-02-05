// Frontend API client — backend-only mode.
// Removed direct calls to OpenAI/HuggingFace from the frontend for security.
// The frontend now requires VITE_BACKEND_URL to be set and will send requests
// with credentials: 'include' so the server-side handles AI calls and persistence.

import type { Message } from '../types'
import * as auth from './auth'

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') ?? ''

async function parseJsonSafe(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Generic request wrapper that sends credentials and attempts a refresh+retry on 401 once.
 */
async function request(path: string, opts: RequestInit = {}, retry = true): Promise<any> {
  if (!BASE) {
    throw new Error('VITE_BACKEND_URL is not set. Frontend must talk to a backend for AI requests.')
  }

  const url = `${BASE}${path}`
  const defaultOpts: RequestInit = { credentials: 'include', headers: {} }
  const merged = { ...defaultOpts, ...opts }

  const res = await fetch(url, merged)
  if (res.ok) {
    const data = await parseJsonSafe(res)
    return data
  }

  // If unauthorized and retry allowed -> try refresh then retry once
  if ((res.status === 401 || res.status === 403) && retry) {
    try {
      const refreshed = await auth.refresh()
      if (refreshed) {
        // retry original request once
        return request(path, opts, false)
      }
    } catch {
      // swallow refresh error and fallthrough to throw original error
    }
  }

  const parsed = await parseJsonSafe(res)
  const message = (parsed && (parsed as any).error) || (parsed && (parsed as any).message) || res.statusText
  const err = new Error(String(message || `Request failed: ${res.status}`))
  ;(err as any).status = res.status
  throw err
}

/* Public API */

export async function fetchHistory(): Promise<Message[]> {
  // Backend required
  return (await request('/api/prompts', { method: 'GET' })) as Message[]
}

export async function postPrompt(prompt: string): Promise<Message> {
  if (!prompt || !String(prompt).trim()) {
    throw new Error('Prompt is required')
  }
  return (await request('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })) as Message
}

export async function clearRemoteHistory(): Promise<void> {
  await request('/api/prompts', { method: 'DELETE' })
}


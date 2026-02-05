// Per-user local storage helpers (backup only).
const PREFIX = 'ai_prompt_history_user_v1_'

export function saveForUser(userId: string, messages: unknown) {
  try {
    if (!userId) return
    localStorage.setItem(PREFIX + userId, JSON.stringify(messages))
  } catch {
    // ignore quota/cookie errors
  }
}

export function loadForUser(userId: string) {
  try {
    if (!userId) return null
    const raw = localStorage.getItem(PREFIX + userId)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearForUser(userId: string) {
  try {
    if (!userId) return
    localStorage.removeItem(PREFIX + userId)
  } catch {
    // ignore
  }
}
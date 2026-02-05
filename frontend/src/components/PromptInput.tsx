import React, { FormEvent } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
}

/**
 * PromptInput: single full-width input only (no inline button).
 * Submits on Enter via onSubmit.
 */
export default function PromptInput({ value, onChange, onSubmit, disabled = false }: Props) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (disabled) return
    if (!value.trim()) return
    onSubmit()
  }

  return (
    <form className="w-full" onSubmit={handleSubmit} aria-label="Prompt form">
      <label htmlFor="prompt-input" className="sr-only">
        Prompt
      </label>

      <input
        id="prompt-input"
        name="prompt"
        type="text"
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Try: Summarize a blog post in 3 bullets..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-disabled={disabled}
        aria-required="true"
        autoComplete="off"
      />
    </form>
  )
}
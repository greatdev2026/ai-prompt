import React from 'react'
import type { Message } from '../types'

type Props = {
  m: Message
}

export default function MessageItem({ m }: Props) {
  return (
    <article
      aria-label={`Prompt from ${new Date(m.createdAt).toLocaleString()}`}
      className="space-y-2 rounded-md border border-gray-200 bg-white p-4"
    >
      <header className="flex items-baseline justify-between">
        <div className="text-sm text-gray-600">
          <strong className="text-indigo-600">You</strong>
        </div>
        <time className="text-xs text-gray-500" dateTime={m.createdAt}>
          {new Date(m.createdAt).toLocaleString()}
        </time>
      </header>

      <div className="text-sm text-gray-800">
        <div className="mb-2">
          <span className="font-medium text-gray-700">Prompt:</span> {m.prompt}
        </div>
        <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-gray-800">{m.response}</div>
      </div>
    </article>
  )
}
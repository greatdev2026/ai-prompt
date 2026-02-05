import React from 'react'
import type { Message } from '../types'
import MessageItem from './MessageItem'

type Props = {
  items: Message[]
  className?: string
}

export default function MessageList({ items, className = '' }: Props) {
  if (!items || items.length === 0) {
    return <div className="text-gray-500">No history yet — send a prompt to start.</div>
  }

  return (
    <ul
      role="list"
      aria-live="polite"
      aria-relevant="additions"
      className={`space-y-3 overflow-auto max-h-[60vh] scrollbar-thin ${className}`}
    >
      {items
        .slice()
        .reverse()
        .map((m: Message) => (
          <li key={m.id}>
            <MessageItem m={m} />
          </li>
        ))}
    </ul>
  )
}
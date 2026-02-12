import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './markdown-renderer'
import { StreamingIndicator } from './streaming-indicator'
import type { ResearchMessage } from '@/types'

interface ResearchMessageBubbleProps {
  message: ResearchMessage
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function UserAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-ledger-black flex items-center justify-center flex-shrink-0">
      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  )
}

function AgentAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-ledger-gray-700 to-ledger-black flex items-center justify-center flex-shrink-0">
      <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="9" cy="16" r="1" fill="currentColor" />
        <circle cx="15" cy="16" r="1" fill="currentColor" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    </div>
  )
}

export function ResearchMessageBubble({ message }: ResearchMessageBubbleProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex gap-3 ml-auto max-w-[75%]">
        <div className="flex flex-col gap-1 items-end flex-1">
          <div className="rounded-2xl rounded-br-sm bg-ledger-black text-white px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <span className="text-[10px] text-ledger-gray-400 px-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <UserAvatar />
      </div>
    )
  }

  return (
    <div className="flex gap-3 mr-auto max-w-[75%]">
      <AgentAvatar />
      <div className="flex flex-col gap-1 items-start flex-1">
        <div className="rounded-2xl rounded-bl-sm bg-white border border-ledger-gray-200 px-4 py-2.5">
          {message.isStreaming && !message.content ? (
            <StreamingIndicator />
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          {message.isStreaming && message.content && (
            <span className="inline-block w-0.5 h-4 bg-ledger-gray-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
        <span className="text-[10px] text-ledger-gray-400 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

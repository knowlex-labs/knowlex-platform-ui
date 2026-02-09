import { User, Bot } from 'lucide-react'
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

export function ResearchMessageBubble({ message }: ResearchMessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
          isUser
            ? 'bg-ledger-black text-white'
            : 'bg-ledger-gray-200 text-ledger-gray-700'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-1 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2.5',
            isUser
              ? 'bg-ledger-black text-white'
              : 'bg-white border border-ledger-gray-200'
          )}
        >
          {message.isStreaming && !message.content ? (
            <StreamingIndicator />
          ) : isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

import { User, Bot } from 'lucide-react'
import type { WorkspaceMessage } from '@/types'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: WorkspaceMessage
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isToolExecution = message.content.startsWith('[Executing tool:')

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-ledger-black' : 'bg-ledger-gray-100'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-ledger-white" />
        ) : (
          <Bot className="h-4 w-4 text-ledger-gray-600" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-2 rounded-lg',
            isUser
              ? 'bg-ledger-black text-ledger-white'
              : 'bg-ledger-gray-100 text-ledger-black',
            isToolExecution && 'bg-ledger-gray-50 border border-ledger-gray-200 italic text-sm'
          )}
        >
          {/* Render message content with basic markdown support */}
          <div className="text-sm whitespace-pre-wrap">
            {message.content.split('\n').map((line, i) => {
              // Handle bold text (**text**)
              const parts = line.split(/(\*\*.*?\*\*)/g)
              return (
                <span key={i}>
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong key={j} className="font-semibold">
                          {part.slice(2, -2)}
                        </strong>
                      )
                    }
                    return part
                  })}
                  {i < message.content.split('\n').length - 1 && <br />}
                </span>
              )
            })}
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-ledger-gray-400 mt-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

import { User, Bot, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkspaceMessage } from '@/types'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: WorkspaceMessage
  onEditDraft?: (content: string) => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function ChatMessage({ message, onEditDraft }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const content = message.content || ''
  const isToolExecution = content.startsWith('[Executing tool:')
  const showEditButton = !isUser && !isToolExecution && onEditDraft

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
            {content.split('\n').map((line, i) => {
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
                  {i < content.split('\n').length - 1 && <br />}
                </span>
              )
            })}
          </div>
        </div>

        {/* Actions and Timestamp */}
        <div className="flex items-center gap-2 mt-1">
          {showEditButton && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1 text-ledger-gray-500 hover:text-ledger-black"
              onClick={() => onEditDraft(content)}
            >
              <Pencil className="h-3 w-3" />
              Edit Draft
            </Button>
          )}
          <span className="text-xs text-ledger-gray-400">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

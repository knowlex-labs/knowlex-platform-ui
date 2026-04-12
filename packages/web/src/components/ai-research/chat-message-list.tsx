import { useEffect, useRef } from 'react'
import { User, Bot } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatMessage } from '@knowlex/core/types/chat.types'
import { cn } from '@/lib/utils'

interface ChatMessageListProps {
  messages: ChatMessage[]
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
      <div className="space-y-6 max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.role === 'user'
                  ? 'bg-ledger-black text-ledger-white'
                  : 'bg-ledger-gray-200 text-ledger-gray-700'
              )}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={cn(
                'flex-1 space-y-1',
                message.role === 'user' ? 'text-right' : 'text-left'
              )}
            >
              <div
                className={cn(
                  'inline-block rounded-lg px-4 py-2 max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-ledger-black text-ledger-white'
                    : 'bg-ledger-gray-100 text-ledger-black'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className="text-xs text-ledger-gray-400 px-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-ledger-gray-300 mx-auto mb-4" />
            <p className="text-sm text-ledger-gray-500">
              No messages yet. Start a conversation!
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

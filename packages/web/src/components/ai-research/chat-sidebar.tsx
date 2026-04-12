import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatSession } from '@knowlex/core/types/chat.types'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string
  onSessionSelect: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
}: ChatSidebarProps) {
  return (
    <div className="w-64 border border-ledger-gray-200 rounded-lg bg-ledger-white flex flex-col overflow-hidden hidden md:flex">
      {/* Header */}
      <div className="p-4 border-b border-ledger-gray-200">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                'group relative rounded-lg p-3 cursor-pointer transition-colors',
                activeSessionId === session.id
                  ? 'bg-ledger-gray-100'
                  : 'hover:bg-ledger-gray-50'
              )}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-ledger-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ledger-black line-clamp-2">
                    {session.title}
                  </p>
                  <p className="text-xs text-ledger-gray-500 mt-1">
                    {formatDate(session.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-ledger-gray-200 transition-opacity"
                  title="Delete session"
                >
                  <Trash2 className="h-3 w-3 text-ledger-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

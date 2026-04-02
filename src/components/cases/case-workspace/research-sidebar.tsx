import { useState } from 'react'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { isToday, isYesterday, isThisWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DraftChatSession } from '@/types'

function formatSessionDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupSessionsByDate(sessions: DraftChatSession[]) {
  const groups: Record<string, DraftChatSession[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  }
  for (const session of sessions) {
    const date = session.createdAt
    if (isToday(date)) groups['Today'].push(session)
    else if (isYesterday(date)) groups['Yesterday'].push(session)
    else if (isThisWeek(date)) groups['This Week'].push(session)
    else groups['Older'].push(session)
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, sessions]) => ({ label, sessions }))
}

interface ResearchSidebarProps {
  sessions: DraftChatSession[]
  activeSessionId: string | null
  isLoadingSessions: boolean
  onSelectSession: (id: string) => void
  onStartNewChat: () => void
  onDeleteSession: (id: string) => void
}

export function ResearchSidebar({
  sessions,
  activeSessionId,
  isLoadingSessions,
  onSelectSession,
  onStartNewChat,
  onDeleteSession,
}: ResearchSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete)
    }
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  const grouped = groupSessionsByDate(sessions)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-kx-card-border flex-shrink-0">
        <span className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wider">Chats</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-ledger-gray-500 hover:text-kx-primary-700"
          title="New chat"
          onClick={onStartNewChat}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Sessions list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoadingSessions && (
            <div className="space-y-1.5 px-2 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-ledger-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!isLoadingSessions && sessions.length === 0 && (
            <div className="text-center py-10 px-3">
              <MessageSquare className="h-8 w-8 text-ledger-gray-300 mx-auto mb-2" />
              <p className="text-xs text-ledger-gray-400">No chats yet</p>
              <p className="text-xs text-ledger-gray-300 mt-0.5">Start a new chat to begin</p>
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] font-medium text-ledger-gray-400 uppercase tracking-wider px-2 mb-1">
                {group.label}
              </p>
              {group.sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    'group w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors',
                    session.id === activeSessionId
                      ? 'bg-kx-primary-50 text-kx-primary-900'
                      : 'hover:bg-ledger-gray-100 text-ledger-gray-700'
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{session.title}</p>
                    <p className="text-[10px] text-ledger-gray-400">{formatSessionDate(session.createdAt)}</p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-ledger-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                      title="Delete session"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Delete session confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete session?</DialogTitle>
            <DialogDescription>
              This will permanently delete this chat session and all its messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

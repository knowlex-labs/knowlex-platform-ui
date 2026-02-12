import { Plus, MessageSquare, Trash2, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { isToday, isYesterday, isThisWeek } from 'date-fns'
import type { ResearchSession } from '@/types'

interface ResearchSessionSidebarProps {
  sessions: ResearchSession[]
  activeSessionId: string | null
  onSessionSelect: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
}

interface SessionGroup {
  label: string
  sessions: ResearchSession[]
}

function groupSessions(sessions: ResearchSession[]): SessionGroup[] {
  const groups: Record<string, ResearchSession[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  }

  for (const session of sessions) {
    const date = new Date(session.createdAt)
    if (isToday(date)) {
      groups['Today'].push(session)
    } else if (isYesterday(date)) {
      groups['Yesterday'].push(session)
    } else if (isThisWeek(date)) {
      groups['This Week'].push(session)
    } else {
      groups['Older'].push(session)
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, sessions: items }))
}

function SessionList({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
}: ResearchSessionSidebarProps) {
  const groups = groupSessions(sessions)

  return (
    <div className="flex flex-col h-full">
      {/* New Chat button */}
      <div className="p-3 border-b border-ledger-gray-200">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Session list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {groups.length === 0 && (
            <p className="text-xs text-ledger-gray-400 text-center py-8">No conversations yet</p>
          )}
          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] font-medium text-ledger-gray-400 uppercase tracking-wider px-2 mb-1">
                {group.label}
              </p>
              {group.sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group relative rounded-lg px-2 py-2 cursor-pointer transition-colors flex items-center gap-2',
                    activeSessionId === session.id
                      ? 'bg-ledger-gray-100 border-l-2 border-ledger-black'
                      : 'hover:bg-ledger-gray-50'
                  )}
                  onClick={() => onSessionSelect(session.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0" />
                  <p className="text-sm text-ledger-black truncate flex-1">
                    {session.title}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-ledger-gray-200 transition-opacity flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3 text-ledger-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Desktop sidebar (inline panel)
export function ResearchSessionSidebarDesktop(props: ResearchSessionSidebarProps & { visible: boolean }) {
  if (!props.visible) return null

  return (
    <div className="hidden md:flex w-72 border-r border-ledger-gray-200 bg-white flex-col flex-shrink-0">
      <SessionList {...props} />
    </div>
  )
}

// Mobile sidebar (Sheet)
export function ResearchSessionSidebarMobile(
  props: ResearchSessionSidebarProps & { open: boolean; onOpenChange: (open: boolean) => void }
) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="px-4 py-3 border-b border-ledger-gray-200">
          <SheetTitle className="text-sm">Chat History</SheetTitle>
        </SheetHeader>
        <SessionList
          sessions={props.sessions}
          activeSessionId={props.activeSessionId}
          onSessionSelect={(id) => {
            props.onSessionSelect(id)
            props.onOpenChange(false)
          }}
          onNewChat={() => {
            props.onNewChat()
            props.onOpenChange(false)
          }}
          onDeleteSession={props.onDeleteSession}
        />
      </SheetContent>
    </Sheet>
  )
}

// Mobile menu toggle button
export function MobileSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden h-10 w-10 text-ledger-gray-500 p-0"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}

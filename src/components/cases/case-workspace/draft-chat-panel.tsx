import { useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Bot, Settings2, Trash2, ChevronDown, MessageSquare, Eraser, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isToday, isYesterday, isThisWeek } from 'date-fns'
import { DraftChatInterface } from './draft-chat-interface'
import type { DraftChatMessage, DraftChatSettings, DraftChatSession } from '@/types'
import { cn } from '@/lib/utils'

interface DraftChatPanelProps {
  messages: DraftChatMessage[]
  isStreaming: boolean
  isLoadingHistory: boolean
  sessions: DraftChatSession[]
  activeSessionId: string | null
  isLoadingSessions: boolean
  selectedSourceCount: number
  settings: DraftChatSettings
  onSendMessage: (message: string) => Promise<void>
  onClearChat: () => void
  onDeleteSession: (id: string) => void
  onSelectSession: (id: string) => void
  onUpdateSettings: (updates: Partial<DraftChatSettings>) => void
  onStartNewChat?: () => void
  showGreeting?: boolean
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { label: string; value: T }[]
  value: T
  onChange: (val: T) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-ledger-gray-500 mb-1.5">{label}</p>
      <div className="flex rounded-lg border border-ledger-gray-200 overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 text-xs py-1.5 px-2 transition-colors',
              value === opt.value
                ? 'bg-kx-primary-600 text-white font-medium'
                : 'text-ledger-gray-600 hover:bg-ledger-gray-50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

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

export function DraftChatPanel({
  messages,
  isStreaming,
  isLoadingHistory,
  sessions,
  activeSessionId,
  isLoadingSessions,
  selectedSourceCount,
  settings,
  onSendMessage,
  onClearChat,
  onDeleteSession,
  onSelectSession,
  onUpdateSettings,
  onStartNewChat,
  showGreeting = false,
}: DraftChatPanelProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [sessionSwitcherOpen, setSessionSwitcherOpen] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const handleConfirmClear = () => {
    setClearDialogOpen(false)
    onClearChat()
  }

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
    setSessionSwitcherOpen(false)
  }

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId)
    setSessionSwitcherOpen(false)
  }

  return (
    <div className="flex flex-col h-full bg-kx-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kx-card-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-4 w-4 text-kx-primary-600 flex-shrink-0" />

          {/* Session switcher */}
          <PopoverPrimitive.Root open={sessionSwitcherOpen} onOpenChange={setSessionSwitcherOpen}>
            <PopoverPrimitive.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 min-w-0 text-sm font-semibold text-kx-primary-900 hover:text-kx-primary-700 transition-colors"
              >
                <span className="truncate">
                  {isLoadingSessions
                    ? 'Loading...'
                    : activeSession?.title || 'Chat'}
                </span>
                <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-60" />
              </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="bottom"
                align="start"
                sideOffset={6}
                className="z-50 w-80 rounded-xl border border-ledger-gray-200 bg-kx-card shadow-lg animate-in fade-in-0 zoom-in-95"
              >
                {/* New Chat button — only when current chat has messages */}
                {onStartNewChat && messages.length > 0 && (
                  <div className="p-2 border-b border-ledger-gray-100">
                    <button
                      type="button"
                      onClick={() => { onStartNewChat(); setSessionSwitcherOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-kx-primary-700 hover:bg-kx-primary-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New Chat
                    </button>
                  </div>
                )}

                {/* Date-grouped session list */}
                <ScrollArea className="max-h-72">
                  <div className="p-1.5">
                    {sessions.length === 0 && !isLoadingSessions && (
                      <p className="text-xs text-ledger-gray-400 text-center py-4">No sessions</p>
                    )}
                    {groupSessionsByDate(sessions).map((group) => (
                      <div key={group.label} className="mb-2">
                        <p className="text-[10px] font-medium text-ledger-gray-400 uppercase tracking-wider px-3 mb-1 mt-1">
                          {group.label}
                        </p>
                        {group.sessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group',
                              session.id === activeSessionId
                                ? 'bg-kx-primary-50 text-kx-primary-900'
                                : 'hover:bg-ledger-gray-50 text-ledger-gray-700'
                            )}
                          >
                            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{session.title}</p>
                              <p className="text-[10px] text-ledger-gray-400">
                                {formatSessionDate(session.createdAt)}
                              </p>
                            </div>
                            {sessions.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-ledger-gray-400 hover:text-red-500 transition-all"
                                title="Delete session"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <PopoverPrimitive.Arrow className="fill-kx-card" />
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
        </div>

        <div className="flex items-center gap-1">
          {/* Settings popover */}
          <PopoverPrimitive.Root>
            <PopoverPrimitive.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-ledger-gray-600 dark:text-ledger-gray-300 hover:text-kx-primary-700"
                title="Settings"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="bottom"
                align="end"
                sideOffset={6}
                className="z-50 w-64 rounded-xl border border-ledger-gray-200 bg-kx-card p-4 shadow-lg space-y-4 animate-in fade-in-0 zoom-in-95"
              >
                <p className="text-xs font-semibold text-kx-primary-900 uppercase tracking-wide">
                  Assistant Settings
                </p>

                <SegmentedControl
                  label="Tone"
                  value={settings.tone}
                  onChange={(val) => onUpdateSettings({ tone: val })}
                  options={[
                    { label: 'Formal', value: 'formal' },
                    { label: 'Neutral', value: 'neutral' },
                    { label: 'Conv.', value: 'conversational' },
                  ]}
                />

                <SegmentedControl
                  label="Style"
                  value={settings.style}
                  onChange={(val) => onUpdateSettings({ style: val })}
                  options={[
                    { label: 'Precise', value: 'precise' },
                    { label: 'Balanced', value: 'balanced' },
                    { label: 'Detailed', value: 'detailed' },
                  ]}
                />

                <SegmentedControl
                  label="Model"
                  value={settings.model}
                  onChange={(val) => onUpdateSettings({ model: val })}
                  options={[
                    { label: 'OpenAI', value: 'openai' },
                    { label: 'Gemini', value: 'gemini' },
                  ]}
                />

                <PopoverPrimitive.Arrow className="fill-kx-card" />
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>

          {/* Clear messages button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-ledger-gray-600 dark:text-ledger-gray-300 hover:text-red-500"
            title="Clear messages"
            onClick={() => setClearDialogOpen(true)}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-hidden">
        <DraftChatInterface
          messages={messages}
          isStreaming={isStreaming}
          isLoadingHistory={isLoadingHistory}
          selectedSourceCount={selectedSourceCount}
          onSendMessage={onSendMessage}
          showGreeting={showGreeting}
        />
      </div>

      {/* Clear messages confirmation dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear messages?</DialogTitle>
            <DialogDescription>
              This will clear all messages in this conversation. The session will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleConfirmClear}
            >
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete session confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete session?</DialogTitle>
            <DialogDescription>
              This will permanently delete this chat session and all its messages. This action cannot be undone.
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

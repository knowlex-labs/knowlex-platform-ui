import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Trash2, Undo2, Inbox, Archive as ArchiveIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useBacklog, useArchived } from '@/hooks/use-moodboard-lists'
import { cn } from '@/lib/utils'
import type {
  CreateTaskRequest,
  MoodboardStatus,
  MoodboardTask,
  UpdateTaskRequest,
} from '@knowlex/core/types'

type Mode = 'backlog' | 'archived'

interface PanelProps {
  mode: Mode
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: CreateTaskRequest) => Promise<MoodboardTask | null>
  onUpdate: (taskId: string, data: UpdateTaskRequest) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  /** Bumped to force a refetch when the parent knows the list may be stale. */
  refreshSignal: number
}

const config = {
  backlog: {
    title: 'Backlog',
    description: 'Ideas and tasks not yet planned.',
    emptyTitle: 'Backlog is empty',
    emptyDescription: 'Park ideas here for later.',
    activateLabel: 'Move to To Do',
    activateStatus: 'TODO' as MoodboardStatus,
    icon: Inbox,
  },
  archived: {
    title: 'Archive',
    description: 'Completed or shelved tasks.',
    emptyTitle: 'Archive is empty',
    emptyDescription: 'Archived tasks will show up here.',
    activateLabel: 'Restore to To Do',
    activateStatus: 'TODO' as MoodboardStatus,
    icon: ArchiveIcon,
  },
} as const

function TaskRow({
  task,
  activateLabel,
  onActivate,
  onDelete,
  busy,
}: {
  task: MoodboardTask
  activateLabel: string
  onActivate: () => void
  onDelete: () => void
  busy: boolean
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-kx-card-border bg-kx-card">
      {task.imageUrl && (
        <img
          src={task.imageUrl}
          alt=""
          className="h-10 w-10 rounded object-cover flex-shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-kx-text-primary break-words">{task.title}</p>
        {task.description && (
          <p className="text-xs text-ledger-gray-500 mt-0.5 line-clamp-2 break-words">
            {task.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onActivate}
          disabled={busy}
          title={activateLabel}
          className="p-1.5 rounded text-ledger-gray-500 hover:text-kx-primary-600 hover:bg-kx-primary-50 dark:hover:bg-white/5 disabled:opacity-40"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          title="Delete"
          className="p-1.5 rounded text-ledger-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function BacklogArchivePanel({
  mode,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  onDelete,
  refreshSignal,
}: PanelProps) {
  const cfg = config[mode]
  const backlog = useBacklog(mode === 'backlog' && open)
  const archive = useArchived(mode === 'archived' && open)
  const { tasks, isLoading, error, refresh } = mode === 'backlog' ? backlog : archive

  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  // Refetch when the parent signals the data may be stale (e.g. a task was moved
  // into or out of this bucket).
  const lastSignalRef = useRef(refreshSignal)
  useEffect(() => {
    if (open && lastSignalRef.current !== refreshSignal) {
      lastSignalRef.current = refreshSignal
      refresh()
    } else {
      lastSignalRef.current = refreshSignal
    }
  }, [refreshSignal, open, refresh])

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(id))
    try {
      await fn()
      await refresh()
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    setIsAdding(true)
    try {
      const created = await onCreate({
        title: trimmed,
        status: mode === 'backlog' ? 'BACKLOG' : 'ARCHIVED',
      })
      if (created) {
        setNewTitle('')
        await refresh()
        inputRef.current?.focus()
      }
    } finally {
      setIsAdding(false)
    }
  }

  const Icon = cfg.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-full p-0 flex flex-col"
      >
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-ledger-gray-500" />
            <SheetTitle>{cfg.title}</SheetTitle>
          </div>
          <SheetDescription>{cfg.description}</SheetDescription>
        </SheetHeader>

        {mode === 'backlog' && (
          <form onSubmit={handleAdd} className="flex-shrink-0 px-6 pt-4 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add to backlog..."
              disabled={isAdding}
              className="flex-1 px-3 py-2 text-sm border border-kx-card-border rounded-lg bg-kx-surface focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
            />
            <Button type="submit" size="sm" disabled={isAdding || !newTitle.trim()}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>
        )}

        <div className={cn('flex-1 overflow-y-auto px-6 py-4 space-y-2', mode === 'archived' && 'pt-4')}>
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              {error}
            </div>
          )}

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border border-kx-card-border rounded-lg space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : tasks.length === 0 ? (
            <div className="py-8">
              <EmptyState icon={Icon} title={cfg.emptyTitle} description={cfg.emptyDescription} size="sm" />
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                activateLabel={cfg.activateLabel}
                busy={busyIds.has(task.id)}
                onActivate={() =>
                  withBusy(task.id, async () => {
                    await onUpdate(task.id, { status: cfg.activateStatus })
                  })
                }
                onDelete={() =>
                  withBusy(task.id, async () => {
                    await onDelete(task.id)
                  })
                }
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

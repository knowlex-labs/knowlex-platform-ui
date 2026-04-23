import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Image as ImageIcon, GripVertical, MoreVertical, Archive, Inbox, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MoodboardStatus, MoodboardTask } from '@knowlex/core/types'

const statusPill: Record<MoodboardStatus, { label: string; className: string }> = {
  BACKLOG: { label: 'Backlog', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  TODO: { label: 'To Do', className: 'bg-ledger-gray-200 text-ledger-gray-700 dark:bg-ledger-gray-700 dark:text-ledger-gray-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-kx-primary-100 text-kx-primary-700 dark:bg-kx-primary-900/30 dark:text-kx-primary-300' },
  DONE: { label: 'Done', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  ARCHIVED: { label: 'Archived', className: 'bg-ledger-gray-100 text-ledger-gray-500 dark:bg-ledger-gray-800 dark:text-ledger-gray-400' },
}

const statusAccent: Record<MoodboardStatus, string> = {
  BACKLOG: 'border-l-violet-400',
  TODO: 'border-l-ledger-gray-400',
  IN_PROGRESS: 'border-l-kx-primary-500',
  DONE: 'border-l-emerald-500',
  ARCHIVED: 'border-l-ledger-gray-300',
}

const CYCLE: MoodboardStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']
function nextCycleStatus(current: MoodboardStatus): MoodboardStatus {
  const idx = CYCLE.indexOf(current)
  if (idx === -1) return 'TODO'
  return CYCLE[(idx + 1) % CYCLE.length]
}

interface TaskCardProps {
  task: MoodboardTask
  onClick: () => void
  onStatusChange: (status: MoodboardStatus) => void
  onDelete: () => void
}

export function TaskCard({ task, onClick, onStatusChange, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })
  const [menuOpen, setMenuOpen] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const pill = statusPill[task.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      {...attributes}
      {...listeners}
      className={cn(
        'group bg-kx-card border border-kx-card-border rounded-lg p-3 cursor-pointer',
        'border-l-4 hover:border-kx-primary-400 hover:shadow-sm transition-all',
        'touch-none',
        statusAccent[task.status]
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className="mt-0.5 p-0.5 text-ledger-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-kx-text-primary break-words">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-ledger-gray-500 mt-1 line-clamp-2 break-words">
              {task.description}
            </p>
          )}

          {task.imageUrl && (
            <div className="mt-2 rounded overflow-hidden border border-ledger-gray-100 dark:border-white/10">
              <img
                src={task.imageUrl}
                alt=""
                loading="lazy"
                className="w-full h-24 object-cover"
              />
            </div>
          )}

          {!task.imageUrl && task.imageKey && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-ledger-gray-400">
              <ImageIcon className="h-3 w-3" />
              Image attached
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(nextCycleStatus(task.status))
              }}
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                'hover:ring-2 hover:ring-offset-1 hover:ring-kx-primary-300 transition-shadow',
                pill.className
              )}
              title="Click to cycle status"
            >
              {pill.label}
            </button>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1 rounded text-ledger-gray-400 opacity-0 group-hover:opacity-100 hover:text-kx-primary-600 hover:bg-kx-primary-50 dark:hover:bg-white/5 transition-all"
                aria-label="More options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-kx-card border border-kx-card-border rounded-lg shadow-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onStatusChange('BACKLOG') }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-kx-primary-50 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <Inbox className="h-3.5 w-3.5" />
                      Move to backlog
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onStatusChange('ARCHIVED') }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-kx-primary-50 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onDelete() }}
                      className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

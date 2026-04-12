import { Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Task, TaskStatus } from '@knowlex/core/types/task.types'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onMove: (taskId: string, newStatus: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

const PRIORITY_COLORS = {
  low: 'bg-ledger-gray-400',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
}

function formatDueDate(date: Date | null): string | null {
  if (!date) return null

  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function TaskCard({ task, onMove, onEdit, onDelete }: TaskCardProps) {
  const canMoveLeft = task.status !== 'todo'
  const canMoveRight = task.status !== 'done'

  const handleMoveLeft = () => {
    if (task.status === 'in-progress') {
      onMove(task.id, 'todo')
    } else if (task.status === 'done') {
      onMove(task.id, 'in-progress')
    }
  }

  const handleMoveRight = () => {
    if (task.status === 'todo') {
      onMove(task.id, 'in-progress')
    } else if (task.status === 'in-progress') {
      onMove(task.id, 'done')
    }
  }

  const dueDateText = formatDueDate(task.dueDate)
  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'done'

  return (
    <div className="group bg-kx-card border border-kx-card-border rounded-lg p-3 hover:shadow-sm transition-shadow">
      {/* Priority & Actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              PRIORITY_COLORS[task.priority]
            )}
            title={`${task.priority} priority`}
          />
          <span className="text-xs text-ledger-gray-500 capitalize">
            {task.priority}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded hover:bg-ledger-gray-100"
            title="Edit task"
          >
            <Edit2 className="h-3 w-3 text-ledger-gray-500" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950"
            title="Delete task"
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-medium text-kx-primary-900 mb-1 line-clamp-2">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-ledger-gray-500 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Case Name */}
      {task.caseName && (
        <p className="text-xs text-ledger-gray-400 mb-2 truncate">
          {task.caseName}
        </p>
      )}

      {/* Due Date */}
      {dueDateText && (
        <div className="flex items-center gap-1 mb-3">
          <Calendar className="h-3 w-3 text-ledger-gray-400" />
          <span
            className={cn(
              'text-xs',
              isOverdue ? 'text-red-500 font-medium' : 'text-ledger-gray-500'
            )}
          >
            {dueDateText}
          </span>
        </div>
      )}

      {/* Move Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ledger-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMoveLeft}
          disabled={!canMoveLeft}
          className="flex-1 h-8 text-xs"
        >
          <ChevronLeft className="h-3 w-3 mr-1" />
          Back
        </Button>
        {task.status === 'done' ? (
          <div className="flex-1 h-8 flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            Done
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMoveRight}
            disabled={!canMoveRight}
            className="flex-1 h-8 text-xs"
          >
            {task.status === 'todo' ? 'Start' : 'Complete'}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}

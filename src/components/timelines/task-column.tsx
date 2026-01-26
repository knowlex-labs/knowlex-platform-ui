import { ScrollArea } from '@/components/ui/scroll-area'
import { TaskCard } from './task-card'
import type { Task, TaskStatus } from '@/types/task.types'

interface TaskColumnProps {
  title: string
  status: TaskStatus
  tasks: Task[]
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

export function TaskColumn({
  title,
  tasks,
  onMoveTask,
  onEditTask,
  onDeleteTask,
}: TaskColumnProps) {
  return (
    <div className="border border-ledger-gray-200 rounded-lg bg-ledger-white overflow-hidden flex flex-col h-[calc(100vh-250px)]">
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-ledger-gray-200 bg-ledger-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ledger-black uppercase tracking-wide">
            {title}
          </h3>
          <span className="text-xs font-medium text-ledger-gray-500 bg-ledger-white px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1 p-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ledger-gray-400">No tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onMove={onMoveTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

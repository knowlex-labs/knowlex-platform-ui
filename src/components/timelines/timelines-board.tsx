import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskColumn } from './task-column'
import { CreateTaskModal } from './create-task-modal'
import type { Task, TaskStatus } from '@/types/task.types'

// Helper to get date relative to today
const getRelativeDate = (daysOffset: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  date.setHours(17, 0, 0, 0)
  return date
}

// Placeholder tasks with realistic due dates
const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Review contract documents',
    description: 'Review the contract documents for ABC Corp case',
    status: 'todo',
    priority: 'high',
    caseId: '1',
    caseName: 'ABC Corp vs XYZ Ltd',
    dueDate: getRelativeDate(-3), // 3 days overdue
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Prepare witness statement',
    description: 'Draft witness statement for hearing',
    status: 'in-progress',
    priority: 'medium',
    caseId: '2',
    caseName: 'Smith vs Jones',
    dueDate: getRelativeDate(0), // Due today
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'File motion in court',
    description: null,
    status: 'done',
    priority: 'low',
    caseId: '1',
    caseName: 'ABC Corp vs XYZ Ltd',
    dueDate: getRelativeDate(-5), // Completed task with past due date
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: 'Client meeting preparation',
    description: 'Prepare agenda and documents for client meeting',
    status: 'todo',
    priority: 'medium',
    caseId: '3',
    caseName: 'Johnson Estate',
    dueDate: getRelativeDate(1), // Due tomorrow
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    title: 'Research case precedents',
    description: 'Find relevant case law for upcoming hearing',
    status: 'in-progress',
    priority: 'high',
    caseId: '2',
    caseName: 'Smith vs Jones',
    dueDate: getRelativeDate(-2), // 2 days overdue
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    title: 'Draft settlement agreement',
    description: 'Prepare initial draft of settlement terms',
    status: 'todo',
    priority: 'low',
    caseId: '4',
    caseName: 'Tech Solutions LLC',
    dueDate: getRelativeDate(5), // 5 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '7',
    title: 'Submit court filings',
    description: 'File all required documents with the court',
    status: 'done',
    priority: 'high',
    caseId: '3',
    caseName: 'Johnson Estate',
    dueDate: getRelativeDate(-1), // Completed yesterday
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export function TimelinesBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleMoveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      )
    )
  }

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTasks((prev) => [newTask, ...prev])
    setIsCreateModalOpen(false)
  }

  const handleUpdateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTask) return

    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingTask.id
          ? { ...task, ...taskData, updatedAt: new Date() }
          : task
      )
    )
    setEditingTask(null)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
            Timelines
          </h2>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Track tasks across your cases
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TaskColumn
          title="To Do"
          status="todo"
          tasks={todoTasks}
          onMoveTask={handleMoveTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
        <TaskColumn
          title="In Progress"
          status="in-progress"
          tasks={inProgressTasks}
          onMoveTask={handleMoveTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
        <TaskColumn
          title="Done"
          status="done"
          tasks={doneTasks}
          onMoveTask={handleMoveTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>

      {/* Create/Edit Modal */}
      <CreateTaskModal
        open={isCreateModalOpen || !!editingTask}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open)
          if (!open) setEditingTask(null)
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialTask={editingTask || undefined}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { ErrorDisplay } from '@/components/ui/error-display'
import { Skeleton } from '@/components/ui/skeleton'
import { useMoodboard } from '@/hooks/use-moodboard'
import { TaskCard } from './task-card'
import { TaskDetailDialog } from './task-detail-dialog'
import { CreateTaskDialog } from './create-task-dialog'
import { BacklogArchivePanel } from './backlog-archive-panel'
import { cn } from '@/lib/utils'
import type {
  MoodboardStatus,
  MoodboardTask,
} from '@knowlex/core/types'

const COLUMNS: { status: MoodboardStatus; label: string }[] = [
  { status: 'TODO', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'DONE', label: 'Done' },
]

const columnDropId = (status: MoodboardStatus) => `column:${status}`
const parseColumnDropId = (id: string): MoodboardStatus | null => {
  if (!id.startsWith('column:')) return null
  return id.slice('column:'.length) as MoodboardStatus
}

function StatusColumn({
  status,
  label,
  tasks,
  onAddTask,
  onTaskClick,
  onTaskStatusChange,
  onTaskDelete,
}: {
  status: MoodboardStatus
  label: string
  tasks: MoodboardTask[]
  onAddTask: () => void
  onTaskClick: (task: MoodboardTask) => void
  onTaskStatusChange: (taskId: string, status: MoodboardStatus) => void
  onTaskDelete: (taskId: string) => void
}) {
  const dropId = columnDropId(status)
  const { setNodeRef, isOver } = useDroppable({ id: dropId })
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <div className="flex flex-col bg-ledger-gray-50 dark:bg-white/[0.02] border border-kx-card-border rounded-lg overflow-hidden min-h-[400px] flex-1 min-w-[280px]">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-kx-card-border bg-kx-card">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-kx-text-primary truncate">{label}</h3>
          <span className="text-xs text-ledger-gray-400 flex-shrink-0">{tasks.length}</span>
        </div>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 flex flex-col p-3 gap-2 overflow-y-auto',
            isOver && 'bg-kx-primary-50/60 dark:bg-kx-primary-900/10'
          )}
        >
          <button
            type="button"
            onClick={onAddTask}
            className="flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm text-ledger-gray-500 hover:bg-ledger-gray-100 dark:hover:bg-white/5 hover:text-kx-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>

          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onStatusChange={(next) => onTaskStatusChange(task.id, next)}
              onDelete={() => onTaskDelete(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function MoodboardBoard() {
  const {
    board,
    isLoading,
    error,
    refresh,
    updateBoard,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    uploadTaskImage,
    removeTaskImage,
  } = useMoodboard()

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [backlogOpen, setBacklogOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState<MoodboardStatus | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [panelRefreshTick, setPanelRefreshTick] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const columnTasks = useMemo(() => {
    const grouped: Record<MoodboardStatus, MoodboardTask[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      ARCHIVED: [],
    }
    if (!board) return grouped
    for (const t of board.tasks) {
      if (grouped[t.status]) grouped[t.status].push(t)
    }
    for (const status of Object.keys(grouped) as MoodboardStatus[]) {
      grouped[status].sort((a, b) => a.position - b.position)
    }
    return grouped
  }, [board])

  const selectedTask = selectedTaskId
    ? board?.tasks.find((t) => t.id === selectedTaskId) ?? null
    : null
  const activeTask = activeTaskId
    ? board?.tasks.find((t) => t.id === activeTaskId) ?? null
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over || !board) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const active_ = board.tasks.find((t) => t.id === activeId)
    if (!active_) return

    let destStatus: MoodboardStatus = active_.status
    let destIndex = 0

    const colStatus = parseColumnDropId(overId)
    if (colStatus) {
      destStatus = colStatus
      destIndex = columnTasks[destStatus].length
    } else {
      const overTask = board.tasks.find((t) => t.id === overId)
      if (!overTask) return
      destStatus = overTask.status
      const list = columnTasks[destStatus]
      const overIdx = list.findIndex((t) => t.id === overId)
      destIndex = overIdx >= 0 ? overIdx : list.length
    }

    const sameColumn = destStatus === active_.status
    if (sameColumn) {
      const currentIdx = columnTasks[destStatus].findIndex((t) => t.id === activeId)
      if (currentIdx === destIndex || currentIdx === destIndex - 1) return
    }

    const patch: Parameters<typeof moveTask>[1] = { position: destIndex }
    if (!sameColumn) patch.status = destStatus
    moveTask(activeId, patch)
  }

  const handleStatusChange = (taskId: string, status: MoodboardStatus) => {
    updateTask(taskId, { status })
    setPanelRefreshTick((n) => n + 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--mobile-header-height,0px))]">
      <header className="flex-shrink-0 px-6 md:px-8 py-4 border-b border-kx-card-border bg-kx-card">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => {
                  setEditingName(false)
                  if (nameDraft.trim() && nameDraft.trim() !== board?.name) {
                    updateBoard({ name: nameDraft.trim() })
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditingName(false)
                }}
                className="font-serif text-xl font-semibold bg-transparent border-b border-kx-primary-500 focus:outline-none w-full"
              />
            ) : (
              <h1
                className="font-serif text-xl md:text-2xl font-semibold text-kx-text-primary truncate cursor-text"
                onClick={() => {
                  if (board) {
                    setNameDraft(board.name)
                    setEditingName(true)
                  }
                }}
              >
                {board?.name ?? 'Tasks'}
              </h1>
            )}
            {board?.description && (
              <p className="text-sm text-ledger-gray-500 mt-0.5 truncate">{board.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setBacklogOpen(true)}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ledger-gray-500 hover:bg-ledger-gray-100 dark:hover:bg-white/5 hover:text-kx-primary-600 transition-colors"
            >
              Backlog
            </button>
            <button
              type="button"
              onClick={() => setArchiveOpen(true)}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ledger-gray-500 hover:bg-ledger-gray-100 dark:hover:bg-white/5 hover:text-kx-primary-600 transition-colors"
            >
              Archive
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-4 md:p-6">
        {error && <ErrorDisplay message={error} onRetry={refresh} />}

        {isLoading && !board ? (
          <div className="flex gap-4 h-full">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 min-w-[280px] border border-kx-card-border rounded-lg p-4 space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : board ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveTaskId(null)}
          >
            <div className="flex gap-4 h-full overflow-x-auto pb-1">
              {COLUMNS.map(({ status, label }) => (
                <StatusColumn
                  key={status}
                  status={status}
                  label={label}
                  tasks={columnTasks[status]}
                  onAddTask={() => setNewTaskStatus(status)}
                  onTaskClick={(t) => setSelectedTaskId(t.id)}
                  onTaskStatusChange={handleStatusChange}
                  onTaskDelete={deleteTask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="bg-kx-card border border-kx-primary-400 rounded-lg p-3 shadow-lg rotate-1 w-[280px]">
                  <p className="text-sm font-medium">{activeTask.title}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : null}
      </div>

      <CreateTaskDialog
        open={newTaskStatus !== null}
        onOpenChange={(o) => !o && setNewTaskStatus(null)}
        status={newTaskStatus ?? 'TODO'}
        statusLabel={COLUMNS.find((c) => c.status === newTaskStatus)?.label ?? ''}
        onCreate={createTask}
        onUploadImage={uploadTaskImage}
      />

      {board && selectedTask && (
        <TaskDetailDialog
          open={true}
          onOpenChange={(o) => !o && setSelectedTaskId(null)}
          task={selectedTask}
          onUpdate={(data) => {
            setPanelRefreshTick((n) => n + 1)
            return updateTask(selectedTask.id, data)
          }}
          onDelete={async () => {
            await deleteTask(selectedTask.id)
            setSelectedTaskId(null)
          }}
          onUploadImage={(file) => uploadTaskImage(selectedTask.id, file)}
          onRemoveImage={() => removeTaskImage(selectedTask.id)}
        />
      )}

      <BacklogArchivePanel
        mode="backlog"
        open={backlogOpen}
        onOpenChange={setBacklogOpen}
        onCreate={async (data) => {
          const t = await createTask(data)
          setPanelRefreshTick((n) => n + 1)
          return t
        }}
        onUpdate={async (taskId, data) => {
          await updateTask(taskId, data)
          setPanelRefreshTick((n) => n + 1)
        }}
        onDelete={deleteTask}
        refreshSignal={panelRefreshTick}
      />

      <BacklogArchivePanel
        mode="archived"
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onCreate={async (data) => {
          const t = await createTask(data)
          setPanelRefreshTick((n) => n + 1)
          return t
        }}
        onUpdate={async (taskId, data) => {
          await updateTask(taskId, data)
          setPanelRefreshTick((n) => n + 1)
        }}
        onDelete={deleteTask}
        refreshSignal={panelRefreshTick}
      />
    </div>
  )
}

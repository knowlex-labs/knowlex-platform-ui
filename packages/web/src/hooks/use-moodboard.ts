import { useCallback, useEffect, useRef, useState } from 'react'
import { moodboardApi } from '@knowlex/core/api'
import { mapBackendBoard, mapBackendTask } from '@knowlex/core/mappers'
import type {
  CreateTaskRequest,
  Moodboard,
  MoodboardStatus,
  MoodboardTask,
  UpdateBoardRequest,
  UpdateTaskRequest,
} from '@knowlex/core/types'
import { useToast } from './use-toast'

interface MoveTaskArgs {
  status?: MoodboardStatus
  position?: number
}

interface UseMoodboardResult {
  board: Moodboard | null
  isLoading: boolean
  error: string | null
  updateBoard: (data: UpdateBoardRequest) => Promise<void>
  createTask: (data: CreateTaskRequest) => Promise<MoodboardTask | null>
  updateTask: (taskId: string, data: UpdateTaskRequest) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  moveTask: (taskId: string, args: MoveTaskArgs) => Promise<void>
  uploadTaskImage: (taskId: string, file: File) => Promise<void>
  removeTaskImage: (taskId: string) => Promise<void>
  refresh: () => Promise<void>
}

function findTask(board: Moodboard, taskId: string): MoodboardTask | undefined {
  return board.tasks.find((t) => t.id === taskId)
}

function removeTaskFromBoard(board: Moodboard, taskId: string): Moodboard {
  return { ...board, tasks: board.tasks.filter((t) => t.id !== taskId) }
}

// Active statuses: TODO / IN_PROGRESS / DONE. BACKLOG and ARCHIVED live in separate views.
function isActiveStatus(status: MoodboardStatus): boolean {
  return status === 'TODO' || status === 'IN_PROGRESS' || status === 'DONE'
}

function addTaskToBoard(board: Moodboard, task: MoodboardTask): Moodboard {
  if (!isActiveStatus(task.status)) {
    return removeTaskFromBoard(board, task.id)
  }
  return { ...board, tasks: [...board.tasks, task] }
}

function replaceTaskInBoard(board: Moodboard, task: MoodboardTask): Moodboard {
  return addTaskToBoard(removeTaskFromBoard(board, task.id), task)
}

export function useMoodboard(): UseMoodboardResult {
  const [board, setBoard] = useState<Moodboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const boardRef = useRef<Moodboard | null>(null)
  useEffect(() => {
    boardRef.current = board
  }, [board])

  const fetchBoard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await moodboardApi.getBoard()
      setBoard(mapBackendBoard(response.data))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load board'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  const updateBoard = useCallback(
    async (data: UpdateBoardRequest) => {
      if (!boardRef.current) return
      const previous = boardRef.current
      setBoard({
        ...previous,
        name: data.name ?? previous.name,
        description: data.description ?? previous.description,
      })
      try {
        const response = await moodboardApi.updateBoard(data)
        setBoard((curr) =>
          curr
            ? {
                ...curr,
                name: response.data.name,
                description: response.data.description,
                updatedAt: new Date(response.data.updatedAt),
              }
            : curr
        )
      } catch (err) {
        setBoard(previous)
        const message = err instanceof Error ? err.message : 'Failed to update board'
        toast({ title: 'Update failed', description: message, variant: 'destructive' })
      }
    },
    [toast]
  )

  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<MoodboardTask | null> => {
      try {
        const response = await moodboardApi.createTask(data)
        const task = mapBackendTask(response.data)
        setBoard((curr) => (curr ? addTaskToBoard(curr, task) : curr))
        return task
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create task'
        toast({ title: 'Create failed', description: message, variant: 'destructive' })
        return null
      }
    },
    [toast]
  )

  const updateTask = useCallback(
    async (taskId: string, data: UpdateTaskRequest) => {
      if (!boardRef.current) return
      const previous = boardRef.current
      try {
        const response = await moodboardApi.updateTask(taskId, data)
        const updated = mapBackendTask(response.data)
        setBoard((curr) => (curr ? replaceTaskInBoard(curr, updated) : curr))
      } catch (err) {
        setBoard(previous)
        const message = err instanceof Error ? err.message : 'Failed to update task'
        toast({ title: 'Update failed', description: message, variant: 'destructive' })
      }
    },
    [toast]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!boardRef.current) return
      const previous = boardRef.current
      setBoard((curr) => (curr ? removeTaskFromBoard(curr, taskId) : curr))
      try {
        await moodboardApi.deleteTask(taskId)
      } catch (err) {
        setBoard(previous)
        const message = err instanceof Error ? err.message : 'Failed to delete task'
        toast({ title: 'Delete failed', description: message, variant: 'destructive' })
      }
    },
    [toast]
  )

  const moveTask = useCallback(
    async (taskId: string, args: MoveTaskArgs) => {
      if (!boardRef.current) return
      const previous = boardRef.current
      const current = findTask(previous, taskId)
      if (!current) return

      const nextTask: MoodboardTask = {
        ...current,
        status: args.status ?? current.status,
        position: args.position ?? current.position,
      }
      setBoard((curr) => (curr ? replaceTaskInBoard(curr, nextTask) : curr))

      const payload: UpdateTaskRequest = {}
      if (args.status !== undefined) payload.status = args.status
      if (args.position !== undefined) payload.position = args.position

      try {
        const response = await moodboardApi.updateTask(taskId, payload)
        const updated = mapBackendTask(response.data)
        setBoard((curr) => (curr ? replaceTaskInBoard(curr, updated) : curr))
      } catch (err) {
        setBoard(previous)
        const message = err instanceof Error ? err.message : 'Failed to move task'
        toast({ title: 'Move failed', description: message, variant: 'destructive' })
      }
    },
    [toast]
  )

  const uploadTaskImage = useCallback(
    async (taskId: string, file: File) => {
      try {
        const presigned = await moodboardApi.getImageUploadUrl(taskId, file.name)
        await moodboardApi.uploadImageToS3(presigned.data.uploadUrl, file)
        const response = await moodboardApi.updateTask(taskId, {
          imageKey: presigned.data.imageKey,
        })
        const updated = mapBackendTask(response.data)
        setBoard((curr) => (curr ? replaceTaskInBoard(curr, updated) : curr))
        toast({ title: 'Image uploaded', variant: 'success' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload image'
        toast({ title: 'Upload failed', description: message, variant: 'destructive' })
      }
    },
    [toast]
  )

  const removeTaskImage = useCallback(
    async (taskId: string) => {
      if (!boardRef.current) return
      const previous = boardRef.current
      setBoard((curr) => {
        if (!curr) return curr
        const t = findTask(curr, taskId)
        if (!t) return curr
        return replaceTaskInBoard(curr, { ...t, imageKey: null, imageUrl: null })
      })
      try {
        await moodboardApi.deleteTaskImage(taskId)
      } catch (err) {
        setBoard(previous)
        const message = err instanceof Error ? err.message : 'Failed to remove image'
        toast({ title: 'Remove failed', description: message, variant: 'destructive' })
      }
    },
    [toast]
  )

  return {
    board,
    isLoading,
    error,
    updateBoard,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    uploadTaskImage,
    removeTaskImage,
    refresh: fetchBoard,
  }
}

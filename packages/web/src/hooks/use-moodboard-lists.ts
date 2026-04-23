import { useCallback, useEffect, useState } from 'react'
import { moodboardApi } from '@knowlex/core/api'
import { mapBackendTask } from '@knowlex/core/mappers'
import type { MoodboardTask } from '@knowlex/core/types'

interface UseTaskListResult {
  tasks: MoodboardTask[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

function makeListHook(loader: () => ReturnType<typeof moodboardApi.getBacklog>) {
  return function useList(enabled: boolean): UseTaskListResult {
    const [tasks, setTasks] = useState<MoodboardTask[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await loader()
        setTasks((response.data ?? []).map(mapBackendTask))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }, [])

    useEffect(() => {
      if (enabled) refresh()
    }, [enabled, refresh])

    return { tasks, isLoading, error, refresh }
  }
}

export const useBacklog = makeListHook(() => moodboardApi.getBacklog())
export const useArchived = makeListHook(() => moodboardApi.getArchived())

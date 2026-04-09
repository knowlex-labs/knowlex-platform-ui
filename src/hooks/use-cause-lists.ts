import { useState, useCallback, useEffect, useRef } from 'react'
import { causeListApi } from '@/services/api/cause-list-api'
import type { CauseListItem, CauseListFilters } from '@/types'

const DEFAULT_PAGE_SIZE = 20

interface Pagination {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

type TriggerState = 'idle' | 'triggering' | 'polling' | 'completed' | 'failed'

interface UseCauseListsResult {
  items: CauseListItem[]
  filters: CauseListFilters
  setFilters: (filters: CauseListFilters) => void
  pagination: Pagination
  setPage: (page: number) => void
  isLoading: boolean
  error: string | null
  refresh: () => void
  triggerState: TriggerState
  triggerMessage: string
  triggerFetch: (date: string) => void
}

export function useCauseLists(): UseCauseListsResult {
  // Get today's date in IST (Asia/Kolkata)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  const [items, setItems] = useState<CauseListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<CauseListFilters>({ date: today })
  const [pagination, setPagination] = useState<Pagination>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  })

  const [triggerState, setTriggerState] = useState<TriggerState>('idle')
  const [triggerMessage, setTriggerMessage] = useState('')

  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination
  const triggerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCauseLists = useCallback(async (
    currentFilters: CauseListFilters,
    page: number,
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await causeListApi.list({
        ...currentFilters,
        page,
        size: DEFAULT_PAGE_SIZE,
      })
      const pageData = response.data
      const meta = pageData.page ?? pageData
      setItems(pageData.content)
      setPagination({
        page: meta.number ?? 0,
        size: meta.size ?? 20,
        totalElements: meta.totalElements ?? 0,
        totalPages: meta.totalPages ?? 0,
      })
    } catch {
      setError('Failed to load cause lists. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCauseLists(filters, pagination.page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setFilters = useCallback((newFilters: CauseListFilters) => {
    setFiltersState(newFilters)
    fetchCauseLists(newFilters, 0)
  }, [fetchCauseLists])

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
    fetchCauseLists(filtersRef.current, page)
  }, [fetchCauseLists])

  const refresh = useCallback(() => {
    fetchCauseLists(filtersRef.current, paginationRef.current.page)
  }, [fetchCauseLists])

  const triggerFetch = useCallback(async (date: string) => {
    if (triggerIntervalRef.current) {
      clearInterval(triggerIntervalRef.current)
      triggerIntervalRef.current = null
    }

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    setTriggerState('triggering')
    setTriggerMessage(`Fetching cause list for ${formattedDate}...`)

    let jobId: string
    try {
      const result = await causeListApi.trigger(date)
      jobId = result.jobId
    } catch {
      setTriggerState('failed')
      setTriggerMessage('Failed to start fetch. Please try again.')
      return
    }

    setTriggerState('polling')

    let pollCount = 0
    const MAX_POLLS = 20 // 60s at 3s intervals

    triggerIntervalRef.current = setInterval(async () => {
      pollCount++

      if (pollCount > MAX_POLLS) {
        clearInterval(triggerIntervalRef.current!)
        triggerIntervalRef.current = null
        setTriggerState('failed')
        setTriggerMessage('Taking longer than expected, check back later')
        return
      }

      try {
        const job = await causeListApi.pollTrigger(jobId)

        if (job.status === 'completed') {
          clearInterval(triggerIntervalRef.current!)
          triggerIntervalRef.current = null
          setTriggerState('completed')
          setTriggerMessage(
            job.entriesSaved
              ? `Synced ${formattedDate} — ${job.entriesSaved} hearing${job.entriesSaved === 1 ? '' : 's'} found`
              : `Cause list synced for ${formattedDate}`
          )
          fetchCauseLists(filtersRef.current, paginationRef.current.page)
        } else if (job.status === 'failed') {
          clearInterval(triggerIntervalRef.current!)
          triggerIntervalRef.current = null
          setTriggerState('failed')
          setTriggerMessage(job.error ?? 'Fetch failed. Please try again.')
        }
      } catch {
        clearInterval(triggerIntervalRef.current!)
        triggerIntervalRef.current = null
        setTriggerState('failed')
        setTriggerMessage('Job not found — server may have restarted')
      }
    }, 3000)
  }, [fetchCauseLists])

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (triggerIntervalRef.current) {
        clearInterval(triggerIntervalRef.current)
      }
    }
  }, [])

  return {
    items,
    filters,
    setFilters,
    pagination,
    setPage,
    isLoading,
    error,
    refresh,
    triggerState,
    triggerMessage,
    triggerFetch,
  }
}

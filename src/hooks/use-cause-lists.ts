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

interface UseCauseListsResult {
  items: CauseListItem[]
  filters: CauseListFilters
  setFilters: (filters: CauseListFilters) => void
  pagination: Pagination
  setPage: (page: number) => void
  isLoading: boolean
  error: string | null
  refresh: () => void
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

  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

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
      setItems(pageData.content)
      setPagination({
        page: pageData.number,
        size: pageData.size,
        totalElements: pageData.totalElements,
        totalPages: pageData.totalPages,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch cause lists'
      setError(message)
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

  return {
    items,
    filters,
    setFilters,
    pagination,
    setPage,
    isLoading,
    error,
    refresh,
  }
}

// Hook for fetching paginated case list

import { useState, useEffect, useCallback } from 'react'
import { caseApi, ApiError } from '@knowlex/core/api'
import { mapBackendCases } from '@knowlex/core/mappers'
import { getPaginationMeta } from '@knowlex/core/utils'
import type { Case, BackendCaseStatus } from '@knowlex/core/types'

interface UseCasesOptions {
  page?: number
  pageSize?: number
  status?: BackendCaseStatus
}

interface UseCasesResult {
  cases: Case[]
  isLoading: boolean
  error: string | null
  totalElements: number
  totalPages: number
  currentPage: number
  refresh: () => void
  setPage: (page: number) => void
}

export function useCases(options: UseCasesOptions = {}): UseCasesResult {
  const { page: initialPage = 0, pageSize = 20, status } = options

  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)

  const fetchCases = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await caseApi.getAll({
        page: currentPage,
        size: pageSize,
        status,
      })

      if (response.status !== 'success') {
        throw new Error(response.message)
      }

      const paginatedData = response.data
      const mappedCases = mapBackendCases(paginatedData.content)

      setCases(mappedCases)
      const pagination = getPaginationMeta(paginatedData)
      setTotalElements(pagination.totalElements)
      setTotalPages(pagination.totalPages)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch cases'
      setError(message)
      setCases([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, status])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return {
    cases,
    isLoading,
    error,
    totalElements,
    totalPages,
    currentPage,
    refresh: fetchCases,
    setPage,
  }
}

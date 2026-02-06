import { useState, useCallback, useMemo } from 'react'
import type { CaseFilter } from '@/types'
import type { CaseWithClient } from './use-cases-with-clients'

interface UseCaseFiltersResult {
  filters: CaseFilter
  setDateRange: (from: Date | null, to: Date | null) => void
  setClientFilter: (clientId: string | null) => void
  setCaseTypeFilter: (caseType: string | null) => void
  setStatusFilter: (status: string | null) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  filterCases: (cases: CaseWithClient[]) => CaseWithClient[]
}

const initialFilters: CaseFilter = {
  dateRange: null,
  clientId: null,
  caseType: null,
  status: null,
}

export function useCaseFilters(): UseCaseFiltersResult {
  const [filters, setFilters] = useState<CaseFilter>(initialFilters)

  const setDateRange = useCallback((from: Date | null, to: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: from || to ? { from, to } : null,
    }))
  }, [])

  const setClientFilter = useCallback((clientId: string | null) => {
    setFilters((prev) => ({ ...prev, clientId }))
  }, [])

  const setCaseTypeFilter = useCallback((caseType: string | null) => {
    setFilters((prev) => ({ ...prev, caseType }))
  }, [])

  const setStatusFilter = useCallback((status: string | null) => {
    setFilters((prev) => ({ ...prev, status }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.dateRange !== null ||
      filters.clientId !== null ||
      filters.caseType !== null ||
      filters.status !== null
    )
  }, [filters])

  const filterCases = useCallback(
    (cases: CaseWithClient[]): CaseWithClient[] => {
      return cases.filter((caseItem) => {
        // Date range filter
        if (filters.dateRange) {
          const caseDate = caseItem.createdAt
          if (filters.dateRange.from && caseDate < filters.dateRange.from) {
            return false
          }
          if (filters.dateRange.to && caseDate > filters.dateRange.to) {
            return false
          }
        }

        // Client filter
        if (filters.clientId && caseItem.clientId !== filters.clientId) {
          return false
        }

        // Case type filter
        if (filters.caseType && caseItem.caseType !== filters.caseType) {
          return false
        }

        // Status filter
        if (filters.status && caseItem.status !== filters.status) {
          return false
        }

        return true
      })
    },
    [filters]
  )

  return {
    filters,
    setDateRange,
    setClientFilter,
    setCaseTypeFilter,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
    filterCases,
  }
}

import { useState, useCallback, useEffect, useRef } from 'react'
import { judgmentsApi } from '@/services/api/judgments-api'
import type { Judgment, JudgmentFilters, JudgmentSort, SortField } from '@/types'

const DEFAULT_PAGE_SIZE = 20

interface Pagination {
    page: number
    size: number
    totalElements: number
    totalPages: number
}

interface UseJudgmentsResult {
    judgments: Judgment[]
    filters: JudgmentFilters
    setFilters: (filters: JudgmentFilters) => void
    pagination: Pagination
    setPage: (page: number) => void
    isLoading: boolean
    error: string | null
    sort: JudgmentSort | null
    setSort: (sort: JudgmentSort | null) => void
    toggleSort: (field: SortField) => void
    refresh: () => void
}

export function useJudgments(): UseJudgmentsResult {
    const [judgments, setJudgments] = useState<Judgment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFiltersState] = useState<JudgmentFilters>({})
    const [sort, setSortState] = useState<JudgmentSort | null>({ field: 'decisionDate', direction: 'desc' })
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
    const sortRef = useRef(sort)
    sortRef.current = sort

    const formatSort = (s: JudgmentSort | null): string | undefined => {
        if (!s) return undefined
        return `${s.field},${s.direction}`
    }

    const fetchJudgments = useCallback(async (
        currentFilters: JudgmentFilters,
        page: number,
        currentSort: JudgmentSort | null
    ) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await judgmentsApi.list({
                ...currentFilters,
                page,
                size: DEFAULT_PAGE_SIZE,
                sort: formatSort(currentSort),
            })
            const pageData = response.data
            setJudgments(pageData.content)
            setPagination({
                page: pageData.number,
                size: pageData.size,
                totalElements: pageData.totalElements,
                totalPages: pageData.totalPages,
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch judgments'
            setError(message)
            console.error('Failed to fetch judgments:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchJudgments(filters, pagination.page, sort)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const setFilters = useCallback((newFilters: JudgmentFilters) => {
        setFiltersState(newFilters)
        fetchJudgments(newFilters, 0, sortRef.current)
    }, [fetchJudgments])

    const setPage = useCallback((page: number) => {
        setPagination((prev) => ({ ...prev, page }))
        fetchJudgments(filtersRef.current, page, sortRef.current)
    }, [fetchJudgments])

    const setSort = useCallback((newSort: JudgmentSort | null) => {
        setSortState(newSort)
        fetchJudgments(filtersRef.current, 0, newSort)
    }, [fetchJudgments])

    const toggleSort = useCallback((field: SortField) => {
        setSortState((prev) => {
            let next: JudgmentSort
            if (!prev || prev.field !== field) {
                next = { field, direction: 'asc' }
            } else {
                next = { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
            }
            fetchJudgments(filtersRef.current, 0, next)
            return next
        })
    }, [fetchJudgments])

    const refresh = useCallback(() => {
        fetchJudgments(filtersRef.current, paginationRef.current.page, sortRef.current)
    }, [fetchJudgments])

    return {
        judgments,
        filters,
        setFilters,
        pagination,
        setPage,
        isLoading,
        error,
        sort,
        setSort,
        toggleSort,
        refresh,
    }
}

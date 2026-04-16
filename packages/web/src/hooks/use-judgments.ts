import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { judgmentsApi } from '@knowlex/core/api/judgments-api'
import type { Judgment, JudgmentFilters, JudgmentSort, SortField } from '@knowlex/core/types'

const DEFAULT_PAGE_SIZE = 20
const ALLOWED_PAGE_SIZES = [10, 20, 50, 100] as const

function clampPageSize(n: number): number {
    return (ALLOWED_PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE
}

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
    setPageSize: (size: number) => void
    isLoading: boolean
    error: string | null
    sort: JudgmentSort | null
    setSort: (sort: JudgmentSort | null) => void
    toggleSort: (field: SortField) => void
    refresh: () => void
}

function parseFiltersFromParams(params: URLSearchParams): JudgmentFilters {
    const filters: JudgmentFilters = {}
    const search = params.get('search')
    if (search) filters.search = search
    const court = params.get('court')
    if (court) filters.court = court
    const judge = params.get('judge')
    if (judge) filters.judge = judge
    const year = params.get('year')
    if (year) filters.year = Number(year)
    const month = params.get('month')
    if (month) filters.month = Number(month)
    const disposalNature = params.get('disposalNature')
    if (disposalNature) filters.disposalNature = disposalNature.split(',')
    const dateFrom = params.get('dateFrom')
    if (dateFrom) filters.dateFrom = dateFrom
    const dateTo = params.get('dateTo')
    if (dateTo) filters.dateTo = dateTo
    return filters
}

function parseSortFromParams(params: URLSearchParams): JudgmentSort | null {
    const sortField = params.get('sortField') as SortField | null
    const sortDir = params.get('sortDir') as 'asc' | 'desc' | null
    if (sortField && sortDir) return { field: sortField, direction: sortDir }
    return { field: 'decisionDate', direction: 'desc' }
}

function buildSearchParams(
    filters: JudgmentFilters,
    page: number,
    sort: JudgmentSort | null,
    pageSize: number
): URLSearchParams {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.court) params.set('court', filters.court)
    if (filters.judge) params.set('judge', filters.judge)
    if (filters.year) params.set('year', String(filters.year))
    if (filters.month) params.set('month', String(filters.month))
    if (filters.disposalNature?.length) params.set('disposalNature', filters.disposalNature.join(','))
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (page > 0) params.set('page', String(page))
    if (pageSize !== DEFAULT_PAGE_SIZE) params.set('size', String(pageSize))
    if (sort && (sort.field !== 'decisionDate' || sort.direction !== 'desc')) {
        params.set('sortField', sort.field)
        params.set('sortDir', sort.direction)
    }
    return params
}

export function useJudgments(): UseJudgmentsResult {
    const [searchParams, setSearchParams] = useSearchParams()

    const initialFilters = parseFiltersFromParams(searchParams)
    const initialPage = Number(searchParams.get('page') || '0')
    const initialSort = parseSortFromParams(searchParams)
    const initialSize = clampPageSize(Number(searchParams.get('size') || String(DEFAULT_PAGE_SIZE)))

    const [judgments, setJudgments] = useState<Judgment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFiltersState] = useState<JudgmentFilters>(initialFilters)
    const [sort, setSortState] = useState<JudgmentSort | null>(initialSort)
    const [pagination, setPagination] = useState<Pagination>({
        page: initialPage,
        size: initialSize,
        totalElements: 0,
        totalPages: 0,
    })

    const filtersRef = useRef(filters)
    filtersRef.current = filters
    const paginationRef = useRef(pagination)
    paginationRef.current = pagination
    const sortRef = useRef(sort)
    sortRef.current = sort

    const updateUrl = useCallback((f: JudgmentFilters, page: number, s: JudgmentSort | null, pageSize?: number) => {
        const params = buildSearchParams(f, page, s, pageSize ?? paginationRef.current.size)
        setSearchParams(params, { replace: true })
    }, [setSearchParams])

    const formatSort = (s: JudgmentSort | null): string | undefined => {
        if (!s) return undefined
        return `${s.field},${s.direction}`
    }

    const fetchJudgments = useCallback(async (
        currentFilters: JudgmentFilters,
        page: number,
        currentSort: JudgmentSort | null,
        pageSize?: number
    ) => {
        const size = pageSize ?? paginationRef.current.size
        setIsLoading(true)
        setError(null)
        try {
            const response = await judgmentsApi.list({
                ...currentFilters,
                page,
                size,
                sort: formatSort(currentSort),
            })
            const pageData = response.data
            const meta = pageData.page ?? pageData
            setJudgments(pageData.content)
            setPagination({
                page: meta.number ?? 0,
                size: meta.size ?? 20,
                totalElements: meta.totalElements ?? 0,
                totalPages: meta.totalPages ?? 0,
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch judgments'
            setError(message)
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
        updateUrl(newFilters, 0, sortRef.current)
        fetchJudgments(newFilters, 0, sortRef.current)
    }, [fetchJudgments, updateUrl])

    const setPage = useCallback((page: number) => {
        setPagination((prev) => ({ ...prev, page }))
        updateUrl(filtersRef.current, page, sortRef.current)
        fetchJudgments(filtersRef.current, page, sortRef.current)
    }, [fetchJudgments, updateUrl])

    const setPageSize = useCallback((newSize: number) => {
        const size = clampPageSize(newSize)
        setPagination((prev) => ({ ...prev, size, page: 0 }))
        updateUrl(filtersRef.current, 0, sortRef.current, size)
        fetchJudgments(filtersRef.current, 0, sortRef.current, size)
    }, [fetchJudgments, updateUrl])

    const setSort = useCallback((newSort: JudgmentSort | null) => {
        setSortState(newSort)
        updateUrl(filtersRef.current, 0, newSort)
        fetchJudgments(filtersRef.current, 0, newSort)
    }, [fetchJudgments, updateUrl])

    const toggleSort = useCallback((field: SortField) => {
        setSortState((prev) => {
            let next: JudgmentSort
            if (!prev || prev.field !== field) {
                next = { field, direction: 'asc' }
            } else {
                next = { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
            }
            updateUrl(filtersRef.current, 0, next)
            fetchJudgments(filtersRef.current, 0, next)
            return next
        })
    }, [fetchJudgments, updateUrl])

    const refresh = useCallback(() => {
        fetchJudgments(filtersRef.current, paginationRef.current.page, sortRef.current)
    }, [fetchJudgments])

    return {
        judgments,
        filters,
        setFilters,
        pagination,
        setPage,
        setPageSize,
        isLoading,
        error,
        sort,
        setSort,
        toggleSort,
        refresh,
    }
}

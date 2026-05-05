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
    sorts: JudgmentSort[]
    setSorts: (sorts: JudgmentSort[]) => void
    /** Click cycles asc → desc → cleared. With shift held, the column is added/cycled as a secondary sort instead of replacing the current sort. */
    toggleSort: (field: SortField, multi?: boolean) => void
    refresh: () => void
}

const DEFAULT_SORTS: JudgmentSort[] = [{ field: 'decisionDate', direction: 'desc' }]

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

function parseSortsFromParams(params: URLSearchParams): JudgmentSort[] {
    // URL form: ?sort=field,dir&sort=field,dir (Spring Data convention)
    const raw = params.getAll('sort')
    if (raw.length === 0) return DEFAULT_SORTS
    const parsed: JudgmentSort[] = []
    for (const entry of raw) {
        const [field, dir] = entry.split(',')
        if (!field) continue
        const direction: 'asc' | 'desc' = dir === 'asc' ? 'asc' : 'desc'
        parsed.push({ field: field as SortField, direction })
    }
    return parsed.length > 0 ? parsed : DEFAULT_SORTS
}

function isDefaultSorts(sorts: JudgmentSort[]): boolean {
    return sorts.length === 1
        && sorts[0].field === 'decisionDate'
        && sorts[0].direction === 'desc'
}

function buildSearchParams(
    filters: JudgmentFilters,
    page: number,
    sorts: JudgmentSort[],
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
    if (!isDefaultSorts(sorts)) {
        for (const s of sorts) params.append('sort', `${s.field},${s.direction}`)
    }
    return params
}

export function useJudgments(): UseJudgmentsResult {
    const [searchParams, setSearchParams] = useSearchParams()

    const initialFilters = parseFiltersFromParams(searchParams)
    const initialPage = Number(searchParams.get('page') || '0')
    const initialSorts = parseSortsFromParams(searchParams)
    const initialSize = clampPageSize(Number(searchParams.get('size') || String(DEFAULT_PAGE_SIZE)))

    const [judgments, setJudgments] = useState<Judgment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFiltersState] = useState<JudgmentFilters>(initialFilters)
    const [sorts, setSortsState] = useState<JudgmentSort[]>(initialSorts)
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
    const sortsRef = useRef(sorts)
    sortsRef.current = sorts

    const updateUrl = useCallback((f: JudgmentFilters, page: number, s: JudgmentSort[], pageSize?: number) => {
        const params = buildSearchParams(f, page, s, pageSize ?? paginationRef.current.size)
        setSearchParams(params, { replace: true })
    }, [setSearchParams])

    const fetchJudgments = useCallback(async (
        currentFilters: JudgmentFilters,
        page: number,
        currentSorts: JudgmentSort[],
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
                sort: currentSorts.length > 0
                    ? currentSorts.map((s) => `${s.field},${s.direction}`)
                    : undefined,
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
        fetchJudgments(filters, pagination.page, sorts)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const setFilters = useCallback((newFilters: JudgmentFilters) => {
        setFiltersState(newFilters)
        updateUrl(newFilters, 0, sortsRef.current)
        fetchJudgments(newFilters, 0, sortsRef.current)
    }, [fetchJudgments, updateUrl])

    const setPage = useCallback((page: number) => {
        setPagination((prev) => ({ ...prev, page }))
        updateUrl(filtersRef.current, page, sortsRef.current)
        fetchJudgments(filtersRef.current, page, sortsRef.current)
    }, [fetchJudgments, updateUrl])

    const setPageSize = useCallback((newSize: number) => {
        const size = clampPageSize(newSize)
        setPagination((prev) => ({ ...prev, size, page: 0 }))
        updateUrl(filtersRef.current, 0, sortsRef.current, size)
        fetchJudgments(filtersRef.current, 0, sortsRef.current, size)
    }, [fetchJudgments, updateUrl])

    const setSorts = useCallback((newSorts: JudgmentSort[]) => {
        // Empty sorts → fall back to default decisionDate desc.
        const effective = newSorts.length === 0 ? DEFAULT_SORTS : newSorts
        setSortsState(effective)
        updateUrl(filtersRef.current, 0, effective)
        fetchJudgments(filtersRef.current, 0, effective)
    }, [fetchJudgments, updateUrl])

    // 3-state per column: asc → desc → cleared. With `multi` (shift-click), the column is
    // appended as a secondary sort and cycled in place; without it, the column replaces all
    // sorts.
    const toggleSort = useCallback((field: SortField, multi: boolean = false) => {
        setSortsState((prev) => {
            const idx = prev.findIndex((s) => s.field === field)
            let next: JudgmentSort[]
            if (multi) {
                if (idx === -1) {
                    next = [...prev, { field, direction: 'asc' }]
                } else if (prev[idx].direction === 'asc') {
                    next = prev.map((s, i) => i === idx ? { ...s, direction: 'desc' } : s)
                } else {
                    // 'desc' → remove this column from the sort list
                    next = prev.filter((_, i) => i !== idx)
                    if (next.length === 0) next = DEFAULT_SORTS
                }
            } else {
                if (idx === -1 || prev.length !== 1) {
                    next = [{ field, direction: 'asc' }]
                } else if (prev[idx].direction === 'asc') {
                    next = [{ field, direction: 'desc' }]
                } else {
                    next = DEFAULT_SORTS
                }
            }
            updateUrl(filtersRef.current, 0, next)
            fetchJudgments(filtersRef.current, 0, next)
            return next
        })
    }, [fetchJudgments, updateUrl])

    const refresh = useCallback(() => {
        fetchJudgments(filtersRef.current, paginationRef.current.page, sortsRef.current)
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
        sorts,
        setSorts,
        toggleSort,
        refresh,
    }
}

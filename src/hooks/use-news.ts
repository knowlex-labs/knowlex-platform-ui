import { useState, useCallback, useEffect, useRef } from 'react'
import { newsApi } from '@/services/api/news-api'
import type { NewsItem, NewsFilters } from '@/types'

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
    first: boolean
    last: boolean
}

export interface UseNewsResult {
    newsItems: NewsItem[]
    filters: NewsFilters
    setFilters: (filters: NewsFilters) => void
    pagination: Pagination
    setPage: (page: number) => void
    setPageSize: (size: number) => void
    isLoading: boolean
    error: string | null
    refresh: () => void
}

export function useNews(): UseNewsResult {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFiltersState] = useState<NewsFilters>({})
    const [pagination, setPagination] = useState<Pagination>({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: false,
    })

    const filtersRef = useRef(filters)
    filtersRef.current = filters
    const paginationRef = useRef(pagination)
    paginationRef.current = pagination

    const fetchNews = useCallback(async (currentFilters: NewsFilters, page: number, pageSize?: number) => {
        const size = pageSize ?? paginationRef.current.size
        setIsLoading(true)
        setError(null)
        try {
            const response = await newsApi.list({
                ...currentFilters,
                page,
                size,
            })
            const pageData = response.data
            const meta = pageData.page ?? pageData
            setNewsItems(pageData.content)
            setPagination({
                page: meta.number ?? 0,
                size: meta.size ?? DEFAULT_PAGE_SIZE,
                totalElements: meta.totalElements ?? 0,
                totalPages: meta.totalPages ?? 0,
                first: (meta as { first?: boolean }).first ?? (meta.number === 0),
                last: (meta as { last?: boolean }).last ?? (meta.number === meta.totalPages - 1),
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch news'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNews(filters, 0)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const setFilters = useCallback((newFilters: NewsFilters) => {
        setFiltersState(newFilters)
        fetchNews(newFilters, 0)
    }, [fetchNews])

    const setPage = useCallback((page: number) => {
        setPagination((prev) => ({ ...prev, page }))
        fetchNews(filtersRef.current, page)
    }, [fetchNews])

    const setPageSize = useCallback((newSize: number) => {
        const size = clampPageSize(newSize)
        setPagination((prev) => ({ ...prev, size, page: 0 }))
        fetchNews(filtersRef.current, 0, size)
    }, [fetchNews])

    const refresh = useCallback(() => {
        fetchNews(filtersRef.current, paginationRef.current.page)
    }, [fetchNews])

    return {
        newsItems,
        filters,
        setFilters,
        pagination,
        setPage,
        setPageSize,
        isLoading,
        error,
        refresh,
    }
}

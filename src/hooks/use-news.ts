import { useState, useCallback, useEffect, useRef } from 'react'
import { newsApi } from '@/services/api/news-api'
import type { NewsItem, NewsFilters } from '@/types'

const DEFAULT_PAGE_SIZE = 21

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

    const fetchNews = useCallback(async (currentFilters: NewsFilters, page: number) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await newsApi.list({
                ...currentFilters,
                page,
                size: DEFAULT_PAGE_SIZE,
            })
            const pageData = response.data
            const meta = pageData.page ?? pageData
            setNewsItems(pageData.content)
            setPagination({
                page: meta.number ?? 0,
                size: meta.size ?? DEFAULT_PAGE_SIZE,
                totalElements: meta.totalElements ?? 0,
                totalPages: meta.totalPages ?? 0,
                first: meta.first ?? (meta.number === 0),
                last: meta.last ?? (meta.number === meta.totalPages - 1),
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

    const refresh = useCallback(() => {
        fetchNews(filtersRef.current, paginationRef.current.page)
    }, [fetchNews])

    return {
        newsItems,
        filters,
        setFilters,
        pagination,
        setPage,
        isLoading,
        error,
        refresh,
    }
}

import { apiClient } from './api-client'
import type { ApiResponse, PaginatedData, NewsItem, NewsFilters } from '../types'

export interface NewsListParams extends NewsFilters {
    page?: number
    size?: number
}

export const newsApi = {
    list: async (params: NewsListParams = {}): Promise<ApiResponse<PaginatedData<NewsItem>>> => {
        const searchParams = new URLSearchParams()

        if (params.source) searchParams.set('source', params.source)
        if (params.category && params.category !== 'all') searchParams.set('category', params.category)
        if (params.fromDate) searchParams.set('fromDate', params.fromDate)
        if (params.toDate) searchParams.set('toDate', params.toDate)
        if (params.page !== undefined) searchParams.set('page', params.page.toString())
        if (params.size !== undefined) searchParams.set('size', params.size.toString())

        const query = searchParams.toString()
        return apiClient.get<ApiResponse<PaginatedData<NewsItem>>>(`/api/v1/news${query ? `?${query}` : ''}`)
    },
}

import { apiClient } from './api-client'
import type { ApiResponse, PaginatedData, Judgment, JudgmentFilters } from '@/types'

export interface JudgmentListParams extends JudgmentFilters {
    page?: number
    size?: number
    sort?: string
}

export const judgmentsApi = {
    list: async (params: JudgmentListParams = {}): Promise<ApiResponse<PaginatedData<Judgment>>> => {
        const searchParams = new URLSearchParams()

        if (params.page !== undefined) searchParams.set('page', params.page.toString())
        if (params.size !== undefined) searchParams.set('size', params.size.toString())
        if (params.sort) searchParams.set('sort', params.sort)
        if (params.search) searchParams.set('q', params.search)
        if (params.court) searchParams.set('court', params.court)
        if (params.judge) searchParams.set('judge', params.judge)
        if (params.year !== undefined) searchParams.set('year', params.year.toString())
        if (params.month !== undefined) searchParams.set('month', params.month.toString())
        if (params.disposalNature?.length) searchParams.set('disposalNature', params.disposalNature.join(','))
        if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
        if (params.dateTo) searchParams.set('dateTo', params.dateTo)

        const query = searchParams.toString()
        return apiClient.get<ApiResponse<PaginatedData<Judgment>>>(`/api/v1/judgments${query ? `?${query}` : ''}`)
    },

    get: async (id: string): Promise<ApiResponse<Judgment>> => {
        return apiClient.get<ApiResponse<Judgment>>(`/api/v1/judgments/${id}`)
    },

    getPdfUrl: async (id: string): Promise<string> => {
        const response = await apiClient.get<ApiResponse<{ downloadUrl: string }>>(
            `/api/v1/judgments/${id}/download-url`
        )
        return response.data.downloadUrl
    },

    getDisposalNatures: async (): Promise<string[]> => {
        const response = await apiClient.get<ApiResponse<string[]>>(
            `/api/v1/judgments/disposal-natures`
        )
        return response.data
    },

    getCourts: async (): Promise<string[]> => {
        const response = await apiClient.get<ApiResponse<string[]>>(
            `/api/v1/judgments/courts`
        )
        return response.data
    },

    getJudges: async (): Promise<string[]> => {
        const response = await apiClient.get<ApiResponse<string[]>>(
            `/api/v1/judgments/judges`
        )
        return response.data
    },
}

import { apiClient } from './api-client'
import type { ApiResponse, PaginatedData, CauseListItem } from '@/types'

export interface CauseListParams {
  page?: number
  size?: number
  date?: string
  court?: string
}

export const causeListApi = {
  list: async (params: CauseListParams = {}): Promise<ApiResponse<PaginatedData<CauseListItem>>> => {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())
    if (params.date) searchParams.set('date', params.date)
    if (params.court) searchParams.set('court', params.court)

    const query = searchParams.toString()
    return apiClient.get<ApiResponse<PaginatedData<CauseListItem>>>(`/api/v1/cause-lists${query ? `?${query}` : ''}`)
  },

  get: async (id: string): Promise<ApiResponse<CauseListItem>> => {
    return apiClient.get<ApiResponse<CauseListItem>>(`/api/v1/cause-lists/${id}`)
  },
}

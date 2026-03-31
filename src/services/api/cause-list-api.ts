import { apiClient } from './api-client'
import type { ApiResponse, PaginatedData, CauseListItem } from '@/types'

export interface CauseListParams {
  page?: number
  size?: number
  date?: string
  court?: string
  bench?: string
  lawyerName?: string
}

export const causeListApi = {
  list: async (params: CauseListParams = {}): Promise<ApiResponse<PaginatedData<CauseListItem>>> => {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())
    if (params.date) searchParams.set('date', params.date)
    if (params.court) searchParams.set('court', params.court)
    if (params.bench) searchParams.set('bench', params.bench)
    if (params.lawyerName) searchParams.set('lawyerName', params.lawyerName)

    const query = searchParams.toString()
    return apiClient.get<ApiResponse<PaginatedData<CauseListItem>>>(`/api/v1/cause-lists${query ? `?${query}` : ''}`)
  },

  get: async (id: string): Promise<ApiResponse<CauseListItem>> => {
    return apiClient.get<ApiResponse<CauseListItem>>(`/api/v1/cause-lists/${id}`)
  },

  trigger: async (date: string): Promise<{ jobId: string; status: string }> => {
    const response = await apiClient.post<{ status: string; message: string; data: { jobId: string; date: string; status: string } }>(
      '/api/v1/cause-lists/trigger',
      { date },
    )
    return response.data
  },

  pollTrigger: async (jobId: string): Promise<{ status: string; entriesSaved?: number; error?: string }> => {
    const response = await apiClient.get<{ data: { status: string; entriesSaved?: number; error?: string } }>(
      `/api/v1/cause-lists/trigger/${jobId}`,
    )
    return response.data
  },
}

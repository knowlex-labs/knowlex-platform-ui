import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

export interface BackendSummaryResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  content: string
  created_at: string
  updated_at: string
}

export const summaryApi = {
  generate: async (caseId: string): Promise<ApiResponse<BackendSummaryResponse>> => {
    return apiClient.post<ApiResponse<BackendSummaryResponse>>(
      `/api/v1/cases/${caseId}/summary/generate`,
      {}
    )
  },

  get: async (caseId: string): Promise<ApiResponse<BackendSummaryResponse>> => {
    return apiClient.get<ApiResponse<BackendSummaryResponse>>(
      `/api/v1/cases/${caseId}/summary`
    )
  },

  delete: async (caseId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(
      `/api/v1/cases/${caseId}/summary`
    )
  },
}

import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

export type DocumentType =
  | 'contract'
  | 'agreement'
  | 'legal_notice'
  | 'demand_notice'
  | 'petition'
  | 'affidavit'
  | 'application'

export interface CreateDraftRequest {
  title: string
  body: string
  document_type: DocumentType
  file_ids?: string[]
  metadata?: {
    subtype?: string
  }
}

export interface CreateDraftResponse {
  job_id: string
  status: 'pending'
  created_at: string
}

export interface DraftResult {
  draft: string
  sections: string[]
  metadata: {
    document_type: string
    title: string
    summary: string
  }
}

export interface DraftJobResponse {
  job_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  result: DraftResult | null
  error: string | null
}

export interface ListDraftsResponse {
  jobs: DraftJobResponse[]
  total: number
  limit: number
  offset: number
}

export const draftsApi = {
  create: async (data: CreateDraftRequest): Promise<ApiResponse<CreateDraftResponse>> => {
    return apiClient.post<ApiResponse<CreateDraftResponse>>('/api/v1/drafts', data)
  },

  get: async (jobId: string): Promise<ApiResponse<DraftJobResponse>> => {
    return apiClient.get<ApiResponse<DraftJobResponse>>(`/api/v1/drafts/${jobId}`)
  },

  list: async (limit = 10, offset = 0): Promise<ApiResponse<ListDraftsResponse>> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    return apiClient.get<ApiResponse<ListDraftsResponse>>(`/api/v1/drafts?${params}`)
  },

  cancel: async (jobId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`/api/v1/drafts/${jobId}`)
  },
}

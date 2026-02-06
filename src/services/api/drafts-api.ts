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

export type InputMode = 'structured' | 'freetext' | 'file'

export interface CreateDraftRequest {
  title: string
  document_type: DocumentType
  input_mode: InputMode
  subtype?: string
  freetext_body?: string
  file_ids?: string[]
}

export interface CreateDraftResponse {
  job_id: string
  status: 'pending'
  created_at: string
}

export interface DraftResult {
  draft: string
  sections: Array<{ title: string; content: string; order: number }>
  metadata: {
    document_type: string
    title: string
    summary: string
    subtype?: string
    input_mode?: string
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
  create: async (caseId: string, data: CreateDraftRequest): Promise<ApiResponse<CreateDraftResponse>> => {
    return apiClient.post<ApiResponse<CreateDraftResponse>>(`/api/v1/cases/${caseId}/drafts`, data)
  },

  get: async (caseId: string, jobId: string): Promise<ApiResponse<DraftJobResponse>> => {
    return apiClient.get<ApiResponse<DraftJobResponse>>(`/api/v1/cases/${caseId}/drafts/${jobId}`)
  },

  list: async (caseId: string, limit = 10, offset = 0): Promise<ApiResponse<ListDraftsResponse>> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    return apiClient.get<ApiResponse<ListDraftsResponse>>(`/api/v1/cases/${caseId}/drafts?${params}`)
  },

  cancel: async (caseId: string, jobId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`/api/v1/cases/${caseId}/drafts/${jobId}`)
  },
}

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

// Legacy format (for polling single job)
export interface DraftJobResponse {
  job_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  result: DraftResult | null
  error: string | null
}

// New format returned by list endpoint
export interface DraftListItem {
  job_id: string
  title: string
  document_type: string
  status: 'pending' | 'completed' | 'failed'
  draft_body: string
  sections: Array<{ title: string; content: string; order: number }>
  metadata: {
    document_type: string
    title: string
    summary: string
    subtype?: string
    input_mode?: string
    case_id?: string
  }
  created_at: string
  updated_at: string
  completed_at: string | null
}

// The list endpoint returns data as an array directly
export type ListDraftsResponse = DraftListItem[]

export interface UpdateDraftRequest {
  title?: string
  draft_body?: string
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

  update: async (caseId: string, jobId: string, data: UpdateDraftRequest): Promise<ApiResponse<DraftListItem>> => {
    return apiClient.put<ApiResponse<DraftListItem>>(`/api/v1/cases/${caseId}/drafts/${jobId}`, data)
  },
}

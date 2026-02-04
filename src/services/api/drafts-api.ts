import { apiClient } from './api-client'

// Backend API types
export interface BackendDraft {
  id: string
  title: string
  body: string
  document_type: string
  file_ids: string[]
  metadata: Record<string, unknown>
  case_id?: string
  created_at: string
  updated_at: string
}

export interface CreateDraftRequest {
  title: string
  body: string
  document_type: string
  file_ids: string[]
  metadata: Record<string, unknown>
  case_id?: string
}

export interface UpdateDraftRequest {
  title?: string
  body?: string
  document_type?: string
  file_ids?: string[]
  metadata?: Record<string, unknown>
}

export interface ListDraftsResponse {
  drafts: BackendDraft[]
  total: number
  limit: number
  offset: number
}

export const draftsApi = {
  create: async (data: CreateDraftRequest): Promise<BackendDraft> => {
    return apiClient.post<BackendDraft>('/api/v1/drafts', data)
  },

  list: async (caseId?: string, limit = 50, offset = 0): Promise<ListDraftsResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (caseId) {
      params.append('case_id', caseId)
    }
    return apiClient.get<ListDraftsResponse>(`/api/v1/drafts?${params}`)
  },

  get: async (id: string): Promise<BackendDraft> => {
    return apiClient.get<BackendDraft>(`/api/v1/drafts/${id}`)
  },

  update: async (id: string, data: UpdateDraftRequest): Promise<BackendDraft> => {
    return apiClient.put<BackendDraft>(`/api/v1/drafts/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/v1/drafts/${id}`)
  },
}

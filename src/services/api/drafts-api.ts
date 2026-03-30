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
  | 'bail_application'
  | 'criminal_appeal'
  | 'DRAFT'
  | 'SUMMARY'
  | 'SOURCE_DOC'

export type InputMode = 'structured' | 'freetext' | 'file'

export type Language = 'english' | 'hindi' | 'bilingual'

export interface CreateDraftRequest {
  title: string
  document_type: DocumentType
  input_mode: InputMode
  subtype?: string
  freetext_body?: string
  file_ids?: string[]
  language?: Language
  config?: Record<string, string>
}

// Both create and single GET return the same flat CaseDraftResponse shape as list items
export type CreateDraftResponse = DraftListItem
export type DraftJobResponse = DraftListItem

// Item format returned by the list endpoint (flat structure, not nested in result)
export interface DraftListItem {
  id: string
  job_id: string
  title: string
  document_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  draft_body: string
  file_path?: string
  sections: Array<{ title: string; content: string; order: number }>
  metadata: {
    document_type: string
    title: string
    summary: string
    subtype?: string
    input_mode?: string
    case_id?: string
  }
  content_format?: string
  created_at: string
  updated_at: string
  completed_at: string | null
}

// List endpoint returns data as a direct array
export type ListDraftsResponse = DraftListItem[]

export interface UpdateDraftRequest {
  title?: string
  draft_body?: string
  storage_key?: string
}

export interface CitationResult {
  caseName: string
  citation: string
  judgmentId: string | null
  internalPdfUrl: string | null
  sccOnlineUrl: string
  manupatraUrl: string | null
  resolved: boolean
}

// Presigned URL response for draft uploads/downloads
export interface DraftPresignedUrlData {
  uploadUrl: string
  storageKey: string
  storageUrl: string
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

  count: async (caseId: string): Promise<ApiResponse<{ count: number }>> => {
    return apiClient.get<ApiResponse<{ count: number }>>(`/api/v1/cases/${caseId}/drafts/count`)
  },

  cancel: async (caseId: string, jobId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`/api/v1/cases/${caseId}/drafts/${jobId}`)
  },

  update: async (caseId: string, jobId: string, data: UpdateDraftRequest): Promise<ApiResponse<DraftJobResponse>> => {
    return apiClient.put<ApiResponse<DraftJobResponse>>(`/api/v1/cases/${caseId}/drafts/${jobId}`, data)
  },

  // Get presigned URL for upload
  getPresignedUploadUrl: async (documentId: string, fileName: string, contentType: string): Promise<DraftPresignedUrlData> => {
    const response = await apiClient.post<ApiResponse<DraftPresignedUrlData>>(
      '/api/v1/presigned-url/upload',
      { documentId, fileName, contentType }
    )
    return response.data
  },

  // Get presigned URL for download
  getPresignedDownloadUrl: async (documentId: string, fileName: string, contentType: string): Promise<DraftPresignedUrlData> => {
    const response = await apiClient.post<ApiResponse<DraftPresignedUrlData>>(
      '/api/v1/presigned-url/download',
      { documentId, fileName, contentType }
    )
    return response.data
  },

  getCitations: async (caseId: string, documentId: string): Promise<CitationResult[]> => {
    const response = await apiClient.get<ApiResponse<CitationResult[]>>(
      `/api/v1/cases/${caseId}/documents/${documentId}/citations`
    )
    return response.data
  },
}

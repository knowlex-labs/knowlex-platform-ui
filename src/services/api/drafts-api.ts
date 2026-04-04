import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'
import type {
  CreateDraftRequest,
  DraftListItem,
  UpdateDraftRequest,
} from '@/services/api/document-types'

export type { CreateDraftRequest, DraftListItem, UpdateDraftRequest }

// Both create and single GET return the same flat DraftListItem shape
export type CreateDraftResponse = DraftListItem
export type DraftJobResponse = DraftListItem
export type ListDraftsResponse = DraftListItem[]

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
  storageUrl: string   // plain S3 URL (not presigned — do not use for downloads)
  downloadUrl: string  // presigned URL with X-Amz-Signature — use this for downloads
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

  // Create a draft without a case (standalone toolbox use)
  createStandalone: async (data: CreateDraftRequest): Promise<ApiResponse<CreateDraftResponse>> => {
    return apiClient.post<ApiResponse<CreateDraftResponse>>('/api/v1/drafts', data)
  },

  // Poll a standalone draft by job ID (no caseId)
  getStandalone: async (jobId: string): Promise<ApiResponse<DraftJobResponse>> => {
    return apiClient.get<ApiResponse<DraftJobResponse>>(`/api/v1/drafts/${jobId}`)
  },

  getCitations: async (caseId: string, documentId: string): Promise<CitationResult[]> => {
    const response = await apiClient.get<ApiResponse<CitationResult[]>>(
      `/api/v1/cases/${caseId}/documents/${documentId}/citations`
    )
    return response.data
  },
}

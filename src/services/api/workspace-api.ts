import { apiClient } from './api-client'
import type { CaseSource, ChatResponse } from '@/types'

// API response wrapper type
interface ApiResponse<T> {
  status: string
  message: string
  data: T
}

// Presigned URL response from backend
interface PresignedUrlData {
  documentId: string
  uploadUrl: string
  storageKey: string
  storageUrl: string
}

// Backend chat response structure
interface BackendChatResponse {
  answer: string
  confidence: number
  is_relevant: boolean
  chunks: {
    chunk_id: string
    file_id: string
    source: string
    text: string
    relevance_score: number
    page_number: number | null
    concepts: string[]
  }[]
}

// Map backend chat response to frontend ChatResponse
function mapChatResponse(data: BackendChatResponse): ChatResponse {
  return {
    content: data.answer,
    confidence: data.confidence,
    sources: data.chunks.map(chunk => ({
      fileName: chunk.source,
      page: chunk.page_number ?? 0,
      textSnippet: chunk.text,
    })),
  }
}

export const workspaceApi = {
  /**
   * Get all documents for a case
   * GET /api/v1/cases/{caseId}/documents - returns all documents
   * GET /api/v1/cases/{caseId}/documents?type=DRAFT - returns only drafts
   * GET /api/v1/cases/{caseId}/documents?type=USER_UPLOADED - returns only uploaded docs
   * Response: { success: true, data: [...] } - direct array (not paginated)
   */
  async getCaseDocuments(caseId: string, type?: 'USER_UPLOADED' | 'DRAFT'): Promise<CaseSource[]> {
    const params = type ? `?type=${type}` : ''
    const response = await apiClient.get<ApiResponse<CaseSource[]>>(
      `/api/v1/cases/${caseId}/documents${params}`
    )
    return response.data
  },

  /**
   * Get presigned upload URL (simplified flow)
   * POST /api/v1/presigned-url/upload with { caseId, fileName }
   * Backend creates document and returns { documentId, uploadUrl, storageKey, storageUrl }
   */
  async getPresignedUploadUrl(
    caseId: string,
    fileName: string
  ): Promise<PresignedUrlData> {
    const response = await apiClient.post<ApiResponse<PresignedUrlData>>(
      '/api/v1/presigned-url/upload',
      { caseId, fileName }
    )
    return response.data
  },

  /**
   * Step 2: Upload file directly to S3 using pre-signed URL
   */
  async uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`)
    }
  },

  /**
   * Get a presigned download URL for viewing/downloading a document
   * POST /api/v1/presigned-url/download with { documentId }
   */
  async getDownloadUrl(documentId: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ uploadUrl: string }>>(
      '/api/v1/presigned-url/download',
      { documentId }
    )
    return response.data.uploadUrl
  },

  /**
   * Delete a document
   */
  async deleteCaseSource(documentId: string): Promise<void> {
    await apiClient.delete(`/api/v1/documents/${documentId}`)
  },

  /**
   * Send a chat query about the case documents
   */
  async sendChatQuery(query: string, filterFileIds: string[]): Promise<ChatResponse> {
    const response = await apiClient.post<ApiResponse<BackendChatResponse>>('/api/v1/chat/query', {
      query,
      filterFileIds,
    })
    return mapChatResponse(response.data)
  },

  /**
   * Send a summary query (for summarize tool)
   */
  async sendSummaryQuery(query: string, filterFileIds: string[]): Promise<ChatResponse> {
    const response = await apiClient.post<ApiResponse<BackendChatResponse>>('/api/v1/chat/summary', {
      query,
      filterFileIds,
    })
    return mapChatResponse(response.data)
  },

  /**
   * Trigger indexing for a document
   * POST /api/v1/cases/{caseId}/{documentId}/index
   */
  async triggerIndexing(caseId: string, documentId: string): Promise<CaseSource> {
    const response = await apiClient.post<ApiResponse<CaseSource>>(
      `/api/v1/cases/${caseId}/${documentId}/index`
    )
    return response.data
  },

  /**
   * Batch trigger indexing for multiple documents
   */
  async batchTriggerIndexing(caseId: string, documentIds: string[]): Promise<void> {
    await Promise.all(
      documentIds.map(id =>
        apiClient.post(`/api/v1/cases/${caseId}/${id}/index`)
      )
    )
  },

  /**
   * Get indexing status for a document
   * GET /api/v1/cases/{caseId}/{documentId}/indexing-status
   * Returns: pending, processing, completed, failed
   */
  async getIndexingStatus(caseId: string, documentId: string): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ status: string }>>(
      `/api/v1/cases/${caseId}/${documentId}/indexing-status`
    )
    return response.data.status
  },
}

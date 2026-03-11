import { apiClient } from './api-client'
import type { CaseDocument, CaseDocumentStatus, ChatResponse } from '@/types'

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

// Document creation types for unified API
interface CreateDocumentData {
  title: string
  document_type: string
  input_mode: 'structured' | 'freetext' | 'file'
  [key: string]: unknown
}

interface CreateDocumentRequest {
  document_type: 'draft'
  sub_type: string
  data: CreateDocumentData
}

interface CreateDocumentResponse {
  id: string
  jobId: string
  name: string | null
  type: string
  subType: string
  status: string
  jobStatus: string
  indexingStatus: string
  filePath: string | null
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
  async getCaseDocuments(caseId: string, type?: 'USER_UPLOADED' | 'DRAFT'): Promise<CaseDocument[]> {
    const params = type ? `?type=${type}` : ''
    const response = await apiClient.get<ApiResponse<CaseDocument[]>>(
      `/api/v1/cases/${caseId}/documents${params}`
    )
    return response.data
  },

  /**
   * Get presigned upload URL for a NEW document (creates a document record).
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
   * Get presigned upload URL for an EXISTING document (does NOT create a new record).
   * POST /api/v1/presigned-url/upload with { documentId, fileName }
   * Returns { documentId, uploadUrl, storageKey, storageUrl }
   */
  async getPresignedUploadUrlForExisting(
    documentId: string,
    fileName: string
  ): Promise<PresignedUrlData> {
    const response = await apiClient.post<ApiResponse<PresignedUrlData>>(
      '/api/v1/presigned-url/upload',
      { documentId, fileName }
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
  async deleteCaseDocument(caseId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/api/v1/cases/${caseId}/documents/${documentId}`)
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
   * POST /api/v1/cases/{caseId}/documents/{documentId}/index
   */
  async triggerIndexing(caseId: string, documentId: string): Promise<CaseDocument> {
    const response = await apiClient.post<ApiResponse<CaseDocument>>(
      `/api/v1/cases/${caseId}/documents/${documentId}/index`
    )
    return response.data
  },

  /**
   * Batch trigger indexing for multiple documents
   */
  async batchTriggerIndexing(caseId: string, documentIds: string[]): Promise<void> {
    await Promise.all(
      documentIds.map(id =>
        apiClient.post(`/api/v1/cases/${caseId}/documents/${id}/index`)
      )
    )
  },

  /**
   * Get indexing status for a document
   * GET /api/v1/cases/{caseId}/documents/{documentId}/indexing-status
   * Returns: pending, processing, completed, failed
   */
  async getIndexingStatus(caseId: string, documentId: string): Promise<CaseDocumentStatus> {
    const response = await apiClient.get<ApiResponse<{ status: string }>>(
      `/api/v1/cases/${caseId}/documents/${documentId}/indexing-status`
    )
    return response.data.status as CaseDocumentStatus
  },

  /**
   * Create a document using the unified document generation API
   * POST /api/v1/cases/{caseId}/documents
   */
  async createDocument(caseId: string, data: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    const response = await apiClient.post<ApiResponse<CreateDocumentResponse>>(
      `/api/v1/cases/${caseId}/documents`,
      data
    )
    return response.data
  },

  /**
   * Get a document by ID (for polling status)
   * GET /api/v1/cases/{caseId}/documents/{documentId}
   */
  async getDocument(caseId: string, documentId: string): Promise<CreateDocumentResponse> {
    const response = await apiClient.get<ApiResponse<CreateDocumentResponse>>(
      `/api/v1/cases/${caseId}/documents/${documentId}`
    )
    return response.data
  },

  /**
   * Get presigned download URL for a completed document
   * POST /api/v1/presigned-url/download with { documentId }
   * Returns { downloadUrl, storageUrl }
   */
  async getPresignedDownloadUrl(documentId: string): Promise<{ downloadUrl: string; storageUrl: string }> {
    const response = await apiClient.post<ApiResponse<{ downloadUrl: string; storageUrl: string }>>(
      '/api/v1/presigned-url/download',
      { documentId }
    )
    return response.data
  },

  /**
   * Update a document (title, storage_key)
   * PUT /api/v1/cases/{caseId}/documents/{documentId}
   */
  async updateDocument(caseId: string, documentId: string, data: { title?: string; storage_key?: string }): Promise<CreateDocumentResponse> {
    const response = await apiClient.put<ApiResponse<CreateDocumentResponse>>(
      `/api/v1/cases/${caseId}/documents/${documentId}`,
      data
    )
    return response.data
  },
}

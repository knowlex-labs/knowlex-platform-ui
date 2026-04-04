import { apiClient } from './api-client'
import { config } from '@/config/env'
import type { CaseDocument, CaseDocumentStatus, ChatResponse } from '@/types'

const API_BASE_URL = config.apiBaseUrl

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem('auth_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const userId = localStorage.getItem('auth_user_id')
  if (userId) headers['x-user-id'] = userId
  return headers
}

// API response wrapper type
interface ApiResponse<T> {
  status: string
  message: string
  data: T
}

// Spring Boot Page response shape returned by GET /api/v1/documents
interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number   // 0-based current page
  size: number
  first: boolean
  last: boolean
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
  document_type: string
  sub_type?: string
  data?: CreateDocumentData
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
  downloadUrl?: string | null
  signedUrl?: string | null
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
   * List documents for a case — used for non-paginated fetches (drafts, summaries, judgments).
   * GET /api/v1/documents?caseId=<uuid>&type=<type>&size=200
   */
  async getCaseDocuments(
    caseId: string,
    type?: 'USER_UPLOADED' | 'DRAFT' | 'SUMMARY' | 'JUDGMENT'
  ): Promise<CaseDocument[]> {
    const params = new URLSearchParams({ caseId, size: '200' })
    if (type) params.set('type', type)
    const response = await apiClient.get<ApiResponse<SpringPage<CaseDocument>>>(
      `/api/v1/documents?${params}`
    )
    return response.data?.content ?? []
  },

  /**
   * List USER_UPLOADED documents with server-side pagination.
   * GET /api/v1/documents?caseId=<uuid>&type=USER_UPLOADED&page=<0-based>&size=<N>
   * Hook passes 1-based pages; we convert to 0-based here.
   */
  async getCaseDocumentsPaginated(
    caseId: string,
    opts: { page: number; limit: number }
  ): Promise<{ documents: CaseDocument[]; total: number }> {
    const params = new URLSearchParams({
      caseId,
      type: 'USER_UPLOADED',
      page: String(opts.page - 1),   // hook is 1-based → API is 0-based
      size: String(opts.limit),
    })
    const response = await apiClient.get<ApiResponse<SpringPage<CaseDocument>>>(
      `/api/v1/documents?${params}`
    )
    const page = response.data
    return { documents: page?.content ?? [], total: page?.totalElements ?? 0 }
  },

  /**
   * Get presigned upload URL for a NEW document (creates a document record).
   * POST /api/v1/presigned-url/upload with { caseId, fileName }
   * Backend creates document and returns { documentId, uploadUrl, storageKey, storageUrl }
   */
  async getPresignedUploadUrl(
    caseId: string,
    fileName: string,
    fileSize: number
  ): Promise<PresignedUrlData> {
    const response = await apiClient.post<ApiResponse<PresignedUrlData>>(
      '/api/v1/presigned-url/upload',
      { caseId, fileName, fileSize }
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
    fileName: string,
    fileSize: number
  ): Promise<PresignedUrlData> {
    const response = await apiClient.post<ApiResponse<PresignedUrlData>>(
      '/api/v1/presigned-url/upload',
      { documentId, fileName, fileSize }
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
   * Delete a single document
   */
  async deleteCaseDocument(caseId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/api/v1/cases/${caseId}/documents/${documentId}`)
  },

  /**
   * Batch delete documents — one request for all IDs
   * DELETE /api/v1/documents  { documentIds: [...] }
   */
  async batchDeleteDocuments(documentIds: string[]): Promise<void> {
    await fetch(`${API_BASE_URL}/api/v1/documents`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ documentIds }),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? `Batch delete failed: ${res.status}`)
      }
    })
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
   * Update a document (name, storage_key)
   * PUT /api/v1/cases/{caseId}/documents/{documentId}
   */
  async updateDocument(caseId: string, documentId: string, data: { name?: string; storage_key?: string }): Promise<CreateDocumentResponse> {
    const response = await apiClient.put<ApiResponse<CreateDocumentResponse>>(
      `/api/v1/cases/${caseId}/documents/${documentId}`,
      data
    )
    return response.data
  },

  /**
   * Delete a document
   * DELETE /api/v1/cases/{caseId}/documents/{documentId}
   */
  async deleteDocument(caseId: string, documentId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(
      `/api/v1/cases/${caseId}/documents/${documentId}`
    )
  },

  /**
   * Upload a new document using multipart form data
   * POST /api/v1/documents/upload with FormData (file + caseId)
   * Returns the created document's id
   */
  async uploadDocument(caseId: string, file: File): Promise<{ id: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('caseId', caseId)

    const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      let message = `Upload failed: ${response.status}`
      try {
        const data = await response.json()
        if (data?.message) message = data.message
      } catch { /* ignore */ }
      throw new Error(message)
    }

    const data = await response.json()
    return data.data
  },

  /**
   * Fetch the text content of a document, handling both encrypted (downloadUrl) and direct (signedUrl) cases.
   * Falls back to POST /presigned-url/download if neither field is set.
   */
  async fetchDocumentContent(doc: { id: string; signedUrl?: string | null; downloadUrl?: string | null }): Promise<string> {
    if (doc.downloadUrl) {
      const res = await fetch(`${API_BASE_URL}${doc.downloadUrl}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`)
      return res.text()
    }

    if (doc.signedUrl) {
      const res = await fetch(doc.signedUrl)
      if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`)
      return res.text()
    }

    // Fallback: get presigned URL from backend
    const response = await apiClient.post<ApiResponse<{ downloadUrl: string; storageUrl: string }>>(
      '/api/v1/presigned-url/download',
      { documentId: doc.id }
    )
    const presignedUrl = response.data.downloadUrl
    if (!presignedUrl) throw new Error('No download URL available')
    const res = await fetch(presignedUrl)
    if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`)
    return res.text()
  },

  /**
   * Resolve a usable URL for viewing/downloading a document.
   * - If doc.downloadUrl is set: fetch with auth and return a blob URL (for encrypted docs)
   * - If doc.signedUrl is set: return it directly (legacy/judgments)
   */
  async resolveDocumentUrl(doc: { id: string; signedUrl?: string | null; downloadUrl?: string | null }): Promise<string> {
    if (doc.downloadUrl) {
      const res = await fetch(`${API_BASE_URL}${doc.downloadUrl}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to download document: ${res.status}`)
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    }

    if (doc.signedUrl) {
      return doc.signedUrl
    }

    // Fallback: authenticated download endpoint
    const res = await fetch(`${API_BASE_URL}/api/v1/documents/${doc.id}/download`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to download document: ${res.status}`)
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}

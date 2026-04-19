import { apiClient } from './api-client'
import { getAdapters } from './runtime'
import { getAuthHeaders } from './auth-headers'
import type { CaseDocument, CaseDocumentStatus, ChatResponse } from '../types'

function getBaseUrl(): string {
  return getAdapters().env.apiBaseUrl
}

// API response wrapper type
interface ApiResponse<T> {
  status: string
  message: string
  data: T
}

// Spring Boot Page (VIA_DTO) — metadata under `page`, see @EnableSpringDataWebSupport on the API
interface SpringPage<T> {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
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

interface CreateDocumentRequest {
  document_type: string
  sub_type?: string
  data?: Record<string, unknown>
  [key: string]: unknown
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
    type?: 'USER_UPLOADED' | 'DRAFT' | 'SUMMARY' | 'SYNOPSIS' | 'JUDGMENT'
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
   */
  async getCaseDocumentsPaginated(
    caseId: string,
    opts: { page: number; limit: number }
  ): Promise<{ documents: CaseDocument[]; total: number }> {
    const params = new URLSearchParams({
      caseId,
      type: 'USER_UPLOADED',
      page: String(opts.page - 1),   // hook is 1-based ��� API is 0-based
      size: String(opts.limit),
    })
    const response = await apiClient.get<ApiResponse<SpringPage<CaseDocument>>>(
      `/api/v1/documents?${params}`
    )
    const body = response.data
    return {
      documents: body?.content ?? [],
      total: body?.page?.totalElements ?? 0,
    }
  },

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

  async getDownloadUrl(documentId: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ uploadUrl: string }>>(
      '/api/v1/presigned-url/download',
      { documentId }
    )
    return response.data.uploadUrl
  },

  async deleteDocuments(documentIds: string[]): Promise<void> {
    await fetch(`${getBaseUrl()}/api/v1/documents`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ documentIds }),
    }).then(async (res) => {
      if (!res.ok) {
        const body: { message?: string } = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? `Delete failed: ${res.status}`)
      }
    })
  },

  async sendChatQuery(query: string, filterFileIds: string[]): Promise<ChatResponse> {
    const response = await apiClient.post<ApiResponse<BackendChatResponse>>('/api/v1/chat/query', {
      query,
      filterFileIds,
    })
    return mapChatResponse(response.data)
  },

  async sendSummaryQuery(query: string, filterFileIds: string[]): Promise<ChatResponse> {
    const response = await apiClient.post<ApiResponse<BackendChatResponse>>('/api/v1/chat/summary', {
      query,
      filterFileIds,
    })
    return mapChatResponse(response.data)
  },

  async triggerIndexing(caseId: string, documentId: string): Promise<CaseDocument> {
    const response = await apiClient.post<ApiResponse<CaseDocument>>(
      `/api/v1/cases/${caseId}/documents/${documentId}/index`
    )
    return response.data
  },

  async batchTriggerIndexing(caseId: string, documentIds: string[]): Promise<void> {
    await Promise.all(
      documentIds.map(id =>
        apiClient.post(`/api/v1/cases/${caseId}/documents/${id}/index`)
      )
    )
  },

  async getIndexingStatus(caseId: string, documentId: string): Promise<CaseDocumentStatus> {
    const response = await apiClient.get<ApiResponse<{ status: string }>>(
      `/api/v1/cases/${caseId}/documents/${documentId}/indexing-status`
    )
    return response.data.status as CaseDocumentStatus
  },

  async createDocument(caseId: string, data: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    const response = await apiClient.post<ApiResponse<CreateDocumentResponse>>(
      '/api/v1/documents',
      { ...data, case_id: caseId }
    )
    return response.data
  },

  async getDocument(_caseId: string, documentId: string): Promise<CreateDocumentResponse> {
    const response = await apiClient.get<ApiResponse<CreateDocumentResponse>>(
      `/api/v1/documents/${documentId}`
    )
    return response.data
  },

  streamDocumentStatus(
    documentId: string,
    callbacks: {
      onStatus: (doc: CreateDocumentResponse) => void
      onError: (msg: string) => void
      onEnd: () => void
    }
  ): AbortController {
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      ...getAuthHeaders(),
    }
    return getAdapters().sse.stream(
      `${getBaseUrl()}/api/v1/documents/${documentId}/status-stream`,
      { method: 'GET', headers, body: '' },
      {
        onEvent: (event, data) => {
          if (event === 'status') {
            try {
              callbacks.onStatus(JSON.parse(data) as CreateDocumentResponse)
            } catch { /* ignore malformed */ }
          } else if (event === 'error') {
            callbacks.onError(data.trim())
          }
        },
        onError: callbacks.onError,
        onEnd: callbacks.onEnd,
        onUnauthorized: () => {
          getAdapters().eventBus.dispatch('auth:session-expired')
        },
      }
    )
  },

  async getPresignedDownloadUrl(documentId: string): Promise<{ downloadUrl: string; storageUrl: string }> {
    const response = await apiClient.post<ApiResponse<{ downloadUrl: string; storageUrl: string }>>(
      '/api/v1/presigned-url/download',
      { documentId }
    )
    return response.data
  },

  async updateDocument(caseId: string, documentId: string, data: { name?: string; storage_key?: string }): Promise<CreateDocumentResponse> {
    const response = await apiClient.put<ApiResponse<CreateDocumentResponse>>(
      `/api/v1/cases/${caseId}/documents/${documentId}`,
      data
    )
    return response.data
  },

  async uploadDocument(caseId: string, file: File): Promise<{ id: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('caseId', caseId)

    const response = await fetch(`${getBaseUrl()}/api/v1/documents/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      let message = `Upload failed: ${response.status}`
      try {
        const data: Record<string, string> = await response.json()
        if (data?.message) message = data.message
      } catch { /* ignore */ }
      throw new Error(message)
    }

    const data: { data: { id: string } } = await response.json()
    return data.data
  },

  async fetchDocumentContent(doc: { id: string; signedUrl?: string | null; downloadUrl?: string | null }): Promise<string> {
    if (doc.downloadUrl) {
      const res = await fetch(`${getBaseUrl()}${doc.downloadUrl}`, { headers: getAuthHeaders() })
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

  async resolveDocumentUrl(doc: { id: string; signedUrl?: string | null; downloadUrl?: string | null }): Promise<string> {
    const { fileHandler } = getAdapters()

    if (doc.downloadUrl) {
      const res = await fetch(`${getBaseUrl()}${doc.downloadUrl}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to download document: ${res.status}`)
      const blob = await res.blob()
      return fileHandler.createObjectUrl(blob)
    }

    if (doc.signedUrl) {
      return doc.signedUrl
    }

    // Fallback: authenticated download endpoint
    const res = await fetch(`${getBaseUrl()}/api/v1/documents/${doc.id}/download`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to download document: ${res.status}`)
    const blob = await res.blob()
    return fileHandler.createObjectUrl(blob)
  },
}

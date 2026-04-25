import { apiClient } from './api-client'
import { getAdapters } from './runtime'
import { getAuthHeaders } from './auth-headers'
import { POLL, nextDelay } from './poll-config'
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

interface DocumentStatusPayload {
  id: string
  status: string | null
  error: string | null
}

function isTerminalStatus(status: string | null | undefined): boolean {
  if (!status) return false
  const s = status.toUpperCase()
  return s === 'COMPLETED' || s === 'FAILED'
}

async function fetchDocumentStatus(documentId: string): Promise<DocumentStatusPayload> {
  const response = await apiClient.get<ApiResponse<DocumentStatusPayload>>(
    `/api/v1/documents/${documentId}/status`
  )
  return response.data
}

async function fetchDocumentById(documentId: string): Promise<CreateDocumentResponse> {
  const response = await apiClient.get<ApiResponse<CreateDocumentResponse>>(
    `/api/v1/documents/${documentId}`
  )
  return response.data
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
    type?: 'USER_UPLOADED' | 'DRAFT' | 'SUMMARY' | 'SYNOPSIS' | 'JUDGMENT' | 'PRECEDENT'
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

  async getDocumentStatus(documentId: string): Promise<DocumentStatusPayload> {
    return fetchDocumentStatus(documentId)
  },

  /**
   * Fetches the inline PDF preview for a document and returns a blob: URL that can be
   * embedded directly in an <iframe>. Works for any document type — the backend renders
   * non-PDF formats to PDF and caches the result.
   *
   * Caller is responsible for calling URL.revokeObjectURL() when the URL is no longer
   * in use (typically in a useEffect cleanup).
   */
  async fetchDocumentPreviewBlobUrl(documentId: string): Promise<string> {
    const response = await fetch(`${getBaseUrl()}/api/v1/documents/${documentId}/preview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      if (response.status === 401) {
        getAdapters().eventBus.dispatch('auth:session-expired')
      }
      throw new Error(`Preview failed: ${response.status}`)
    }
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },

  /**
   * Poll the document-generation status until the job reaches a terminal state.
   *
   * Cadence: exponential backoff from POLL.initialDelayMs up to POLL.maxDelayMs,
   * capped at POLL.maxDurationMs total elapsed. On COMPLETED, the full document
   * is fetched once and forwarded to onStatus so the consumer can read
   * downloadUrl / signedUrl for content. On FAILED, a minimal payload is forwarded.
   */
  pollDocumentStatus(
    documentId: string,
    callbacks: {
      onStatus: (doc: CreateDocumentResponse) => void
      onError: (msg: string) => void
      onEnd: () => void
    }
  ): AbortController {
    const ctrl = new AbortController()
    const startedAt = Date.now()
    let delay = POLL.initialDelayMs
    let timer: ReturnType<typeof setTimeout> | null = null

    const stop = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    ctrl.signal.addEventListener('abort', stop)

    const finish = (deliverEnd = true) => {
      stop()
      if (deliverEnd) callbacks.onEnd()
    }

    const tick = async () => {
      if (ctrl.signal.aborted) return

      if (Date.now() - startedAt >= POLL.maxDurationMs) {
        callbacks.onError('Status polling timed out')
        finish()
        return
      }

      try {
        const status = await fetchDocumentStatus(documentId)
        if (ctrl.signal.aborted) return

        if (isTerminalStatus(status.status)) {
          const upper = (status.status ?? '').toUpperCase()
          if (upper === 'COMPLETED') {
            try {
              const doc = await fetchDocumentById(documentId)
              if (ctrl.signal.aborted) return
              callbacks.onStatus(doc)
            } catch (err) {
              callbacks.onError(err instanceof Error ? err.message : 'Failed to fetch document')
            }
          } else {
            // FAILED — synthesize a minimal payload; consumer flips state to failed
            callbacks.onStatus({
              id: status.id,
              jobId: '',
              name: null,
              type: '',
              subType: '',
              status: 'failed',
              jobStatus: 'FAILED',
              indexingStatus: '',
              filePath: null,
            })
          }
          finish()
          return
        }
      } catch (err) {
        // Treat 401 as fatal so the auth event bus can take over; everything else
        // is transient — keep polling on the same backoff schedule.
        if (err instanceof Error && err.name === 'SessionExpiredError') {
          callbacks.onError(err.message)
          finish()
          return
        }
      }

      delay = nextDelay(delay)
      timer = setTimeout(tick, delay)
    }

    timer = setTimeout(tick, POLL.initialDelayMs)
    return ctrl
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
    // Always go through the authenticated /download endpoint. It decrypts the file
    // server-side; presigned S3 URLs return raw ciphertext for encrypted documents
    // (which yields garbled text when decoded as UTF-8). The signedUrl/downloadUrl
    // fields on the doc are accepted for backwards compatibility but ignored — the
    // id is sufficient.
    const path = `/api/v1/documents/${doc.id}/download`
    const res = await fetch(`${getBaseUrl()}${path}`, { headers: getAuthHeaders() })
    if (!res.ok) {
      if (res.status === 401) {
        getAdapters().eventBus.dispatch('auth:session-expired')
      }
      throw new Error(`Failed to fetch content: ${res.status}`)
    }
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

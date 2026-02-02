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

// Helper to map file extension to fileType enum
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase() || 'PDF'
  return ['PDF', 'DOCX', 'DOC', 'JPG', 'JPEG', 'PNG'].includes(ext) ? ext : 'PDF'
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
   * Step 1: Get presigned URL for uploading a file to S3
   */
  async getPresignedUploadUrl(
    caseId: string,
    filename: string,
  ): Promise<PresignedUrlData> {
    const response = await apiClient.post<ApiResponse<PresignedUrlData>>(
      '/api/v1/documents/upload-url',
      {
        filename,
        fileType: getFileType(filename),
        caseId,
      }
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
   * Step 3: Register document with backend after S3 upload
   */
  async createCaseSource(
    caseId: string,
    file: File,
    storageUrl: string,
    storageKey: string
  ): Promise<CaseSource> {
    const response = await apiClient.post<ApiResponse<CaseSource>>(
      '/api/v1/documents',
      {
        filename: file.name,
        originalFilename: file.name,
        fileType: getFileType(file.name),
        fileSize: file.size,
        storageUrl,
        storageKey,
        documentSource: 'UPLOAD',
        caseId,
      }
    )
    return response.data
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
   * Re-index a single document (Link Content action)
   */
  async linkContent(documentId: string): Promise<CaseSource> {
    const response = await apiClient.post<ApiResponse<CaseSource>>(
      `/api/v1/documents/${documentId}/link-content`
    )
    return response.data
  },

  /**
   * Batch re-index multiple documents
   */
  async batchLinkContent(documentIds: string[]): Promise<void> {
    await Promise.all(
      documentIds.map(id =>
        apiClient.post(`/api/v1/documents/${id}/link-content`)
      )
    )
  },

  /**
   * Poll indexing status for a document
   */
  async getIndexingStatus(documentId: string): Promise<CaseSource['indexingStatus']> {
    const response = await apiClient.get<ApiResponse<{ status: CaseSource['indexingStatus'] }>>(
      `/api/v1/documents/${documentId}/indexing-status?refresh=true`
    )
    return response.data.status
  },
}

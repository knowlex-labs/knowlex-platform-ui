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

// Helper to map file extension to fileType enum
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase() || 'PDF'
  return ['PDF', 'DOCX', 'DOC', 'JPG', 'JPEG', 'PNG'].includes(ext) ? ext : 'PDF'
}

export const workspaceApi = {
  /**
   * Step 1: Get presigned URL for uploading a file to S3
   */
  async getPresignedUploadUrl(
    caseId: string,
    filename: string,
    contentType: string
  ): Promise<PresignedUrlData> {
    const response = await apiClient.post<ApiResponse<PresignedUrlData>>(
      '/api/v1/documents/upload-url',
      {
        filename,
        fileType: getFileType(filename),
        contentType,
        caseId,
      }
    )
    return response.data
  },

  /**
   * Step 2: Upload file directly to S3 using pre-signed URL
   * Note: This does NOT use the apiClient since it's a direct S3 request
   */
  async uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to upload file to S3: ${response.status}`)
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
  async sendChatQuery(message: string, filterFileIds: string[]): Promise<ChatResponse> {
    return await apiClient.post<ChatResponse>('/api/v1/chat/query', {
      message,
      filterFileIds,
    })
  },

  /**
   * Send a summary query (for summarize tool)
   */
  async sendSummaryQuery(message: string, filterFileIds: string[]): Promise<ChatResponse> {
    return await apiClient.post<ChatResponse>('/api/v1/chat/summary', {
      message,
      filterFileIds,
    })
  },
}

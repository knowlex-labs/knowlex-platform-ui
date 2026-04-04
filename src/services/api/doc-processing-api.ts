import { apiClient } from './api-client'
import { config } from '@/config/env'
import type { ApiResponse } from '@/types'

const API_BASE_URL = config.apiBaseUrl

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem('auth_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const userId = localStorage.getItem('auth_user_id')
  if (userId) headers['x-user-id'] = userId
  return headers
}

export interface ProcessedDocumentInfo {
  id: string
  fileName: string
  fileSize: number
  pageCount: number
  createdAt?: string
  /** Backend decrypt-then-stream endpoint — use this for downloads, not a presigned S3 URL. */
  downloadUrl?: string
}

export interface SplitRequest {
  documentId: string
  pageRanges?: string
}

export interface SplitResponse {
  documents: ProcessedDocumentInfo[]
}

export interface MergeRequest {
  documentIds: string[]
  mergedTitle?: string
}

export interface MergeResponse {
  document: ProcessedDocumentInfo
}

export type ConvertTargetFormat = 'PNG' | 'JPEG' | 'TEXT' | 'PDF'

export interface ConvertRequest {
  documentId: string
  targetFormat: ConvertTargetFormat
  dpi?: number
}

export interface ConvertResponse {
  documents: ProcessedDocumentInfo[]
  textContent: string | null
}

export interface CompressRequest {
  documentId: string
  quality?: 'low' | 'medium' | 'high'
}

export interface CompressResponse {
  document: ProcessedDocumentInfo
}

export type DocumentRecordType = 'USER_UPLOADED' | 'DRAFT' | 'SUMMARY' | 'JUDGMENT'

/**
 * Full document record returned by GET /api/v1/documents/all.
 * Covers every document the user has ever touched across all cases.
 */
export interface DocumentRecord {
  id: string
  caseId: string | null
  caseTitle: string | null
  /** File name or document name */
  name: string
  /** For JUDGMENT: the human-readable judgment title */
  originalFilename: string | null
  fileType: 'PDF' | null
  /** Presigned S3 URL — use for DRAFT/SUMMARY/JUDGMENT downloads */
  storageUrl: string | null
  signedUrl: null
  /** Backend decrypt-stream path — present for USER_UPLOADED */
  downloadUrl: string | null
  type: DocumentRecordType
  subType: string | null
  jobStatus: string | null
  jobId: string | null
  indexingStatus: string | null
  filePath: string
  createdAt: string
  updatedAt: string
}

/**
 * Upload a file for toolbox use.
 * Returns the documentId of the created document.
 * @param opts.type   Document category (default: USER_UPLOADED)
 * @param opts.caseId Optional case to attach the document to
 */
export async function uploadToolboxFile(
  file: File,
  opts?: { type?: string; caseId?: string }
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (opts?.type)   formData.append('type', opts.type)
  if (opts?.caseId) formData.append('caseId', opts.caseId)

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
  return data.data.id
}

/**
 * Download a document via the backend's decrypt-then-stream endpoint.
 * Sends auth headers, receives raw bytes, and triggers a browser download.
 *
 * Use `doc.downloadUrl` from API responses when available; falls back to
 * the standard `/api/v1/documents/{id}/download` path.
 */
export async function downloadDocument(
  idOrPath: string,
  fileName: string
): Promise<void> {
  // idOrPath can be a bare document ID or a full path like /api/v1/documents/{id}/download
  const path = idOrPath.startsWith('/')
    ? idOrPath
    : `/api/v1/documents/${idOrPath}/download`

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Revoke after a tick to let the browser start the download
  setTimeout(() => URL.revokeObjectURL(objectUrl), 100)
}

/**
 * Programmatically trigger a download from a presigned or public URL.
 * No auth headers — use this for storageUrl (presigned S3) values.
 */
export function triggerDirectDownload(url: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.target = '_blank'
  a.rel = 'noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * List all user documents across all cases and standalone.
 * GET /api/v1/documents/all
 * @param type  Optional filter: USER_UPLOADED | DRAFT | SUMMARY | JUDGMENT
 */
export async function listAllDocuments(type?: DocumentRecordType): Promise<DocumentRecord[]> {
  const query = type ? `?type=${type}` : ''
  const res = await apiClient.get<ApiResponse<DocumentRecord[]>>(`/api/v1/documents/all${query}`)
  return res.data ?? []
}

/**
 * List all standalone documents (not attached to any case).
 * GET /api/v1/documents
 */
export async function listStandaloneDocuments(): Promise<ProcessedDocumentInfo[]> {
  const res = await apiClient.get<ApiResponse<ProcessedDocumentInfo[]>>('/api/v1/documents')
  return res.data ?? []
}

/**
 * Attach a standalone document to an existing case.
 * PATCH /api/v1/documents/{id}/link-case
 */
export async function linkDocumentToCase(documentId: string, caseId: string): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(`/api/v1/documents/${documentId}/link-case`, { caseId })
}

export interface EditPdfRequest {
  documentId: string
  caseId?: string | null
  removePages?: { pageNumbers: number[] }
  addTextOverlay?: {
    text: string
    x: number
    y: number
    fontSize: number
    pageNumber: number | null
  }
}

export interface EditPdfResponse {
  document: ProcessedDocumentInfo
}

export interface TranslationJob {
  job_id: string
}

export interface TranslationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  signed_url: string | null
  error: string | null
}

export const docProcessingApi = {
  split: (data: SplitRequest) =>
    apiClient.post<ApiResponse<SplitResponse>>('/api/v1/doc-processing/split', data),

  merge: (data: MergeRequest) =>
    apiClient.post<ApiResponse<MergeResponse>>('/api/v1/doc-processing/merge', data),

  convert: (data: ConvertRequest) =>
    apiClient.post<ApiResponse<ConvertResponse>>('/api/v1/doc-processing/convert', data),

  compress: (data: CompressRequest) =>
    apiClient.post<ApiResponse<CompressResponse>>('/api/v1/doc-processing/compress', data),

  editPdf: (data: EditPdfRequest) =>
    apiClient.post<ApiResponse<EditPdfResponse>>('/api/v1/doc-processing/edit', data),
}

/**
 * Submit a document translation job.
 * POST /api/v1/translations (multipart/form-data)
 */
export async function submitTranslation(
  file: File,
  targetLanguage: string,
  opts?: { sourceLanguage?: string; caseId?: string }
): Promise<TranslationJob> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('target_language', targetLanguage.toLowerCase())
  if (opts?.sourceLanguage) formData.append('source_language', opts.sourceLanguage.toLowerCase())
  if (opts?.caseId) formData.append('case_folder_id', opts.caseId)

  const response = await fetch(`${API_BASE_URL}/api/v1/translations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  })

  if (!response.ok) {
    let message = `Translation failed: ${response.status}`
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch { /* ignore */ }
    throw new Error(message)
  }

  return response.json()
}

/**
 * Poll translation job status.
 * GET /api/v1/translations/{job_id}
 */
export async function getTranslationStatus(jobId: string): Promise<TranslationStatus> {
  const response = await fetch(`${API_BASE_URL}/api/v1/translations/${jobId}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(`Status check failed: ${response.status}`)
  return response.json()
}

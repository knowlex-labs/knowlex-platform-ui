import { apiClient } from './api-client'
import { config } from '@/config/env'
import type { ApiResponse } from '@/types'
import { DocumentType, JobStatus } from '@/types'

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
  /** Pre-rendered HTML body (used for MD→PDF to avoid raw markdown in output) */
  htmlContent?: string
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

/** Alias so call-sites can import DocumentRecordType without changing imports. */
export type DocumentRecordType = DocumentType

/**
 * DocumentResponse — the canonical shape returned by GET /api/v1/documents.
 * Covers every document the user has ever touched across all cases.
 */
export interface DocumentRecord {
  id: string
  caseId: string | null
  caseTitle: string | null
  name: string
  originalFilename: string | null
  fileType: string | null
  fileSize?: number | null
  /** Presigned S3 URL — use for DRAFT/SUMMARY/JUDGMENT downloads */
  storageUrl: string | null
  /** Legacy direct URL */
  signedUrl: string | null
  /** Encrypted doc download — use this when present */
  downloadUrl: string | null
  type: DocumentType
  subType: string | null
  jobStatus: JobStatus | null
  jobId: string | null
  indexingStatus: string | null
  filePath: string | null
  createdAt: string
  updatedAt: string
}

// Spring Page wrapper (shared shape)
interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

/**
 * Upload a file for toolbox use.
 * Returns the documentId of the created document.
 * @param opts.type   Document category (default: USER_UPLOADED)
 * @param opts.caseId Optional case to attach the document to
 */
function inferFileType(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: 'PDF', png: 'PNG', jpg: 'JPEG', jpeg: 'JPEG',
    docx: 'DOCX', doc: 'DOC', md: 'MD',
  }
  return map[ext] ?? null
}

export async function uploadToolboxFile(
  file: File,
  opts?: { type?: string; caseId?: string; fileType?: string }
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (opts?.type)   formData.append('type', opts.type)
  if (opts?.caseId) formData.append('caseId', opts.caseId)
  const ft = opts?.fileType ?? inferFileType(file.name)
  if (ft) formData.append('fileType', ft)

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

export interface ListDocumentsOpts {
  page?: number
  size?: number
  type?: DocumentRecordType
  caseId?: string
  linked?: boolean
  search?: string
  /** Spring Pageable sort string e.g. "createdAt,desc" or "fileName,asc" */
  sort?: string
}

/**
 * Unified paginated document list.
 * GET /api/v1/documents — supports search, sort, type, caseId, linked, page, size.
 */
export async function listAllDocuments(
  opts?: ListDocumentsOpts
): Promise<{ documents: DocumentRecord[]; total: number; totalPages: number }> {
  const params = new URLSearchParams({
    page: String(opts?.page ?? 0),
    size: String(opts?.size ?? 20),
  })
  if (opts?.type)   params.set('type', opts.type)
  if (opts?.caseId) params.set('caseId', opts.caseId)
  if (opts?.linked !== undefined) params.set('linked', String(opts.linked))
  if (opts?.search) params.set('search', opts.search)
  if (opts?.sort)   params.set('sort', opts.sort)
  const res = await apiClient.get<ApiResponse<SpringPage<DocumentRecord>>>(`/api/v1/documents?${params}`)
  return {
    documents: res.data?.content ?? [],
    total: res.data?.totalElements ?? 0,
    totalPages: res.data?.totalPages ?? 0,
  }
}

/**
 * List standalone documents only (not attached to any case).
 * GET /api/v1/documents?linked=false
 */
export async function listStandaloneDocuments(
  opts?: { page?: number; size?: number }
): Promise<{ documents: DocumentRecord[]; total: number }> {
  const result = await listAllDocuments({ linked: false, ...opts })
  return { documents: result.documents, total: result.total }
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

export interface EditSessionResponse {
  editSessionKey: string
  docxDownloadUrl: string
  callbackUrl: string
  title: string
  fileType: string
  onlyOfficeServerUrl: string
  onlyOfficeToken: string
}

export async function openEditSession(
  documentId: string,
  caseId?: string | null
): Promise<EditSessionResponse> {
  const res = await apiClient.post<ApiResponse<EditSessionResponse>>(
    '/api/v1/doc-processing/edit/open',
    { documentId, caseId: caseId ?? null }
  )
  return res.data
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

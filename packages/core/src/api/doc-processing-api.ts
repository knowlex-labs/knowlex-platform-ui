import { apiClient, ApiError, SessionExpiredError } from './api-client'
import { getAdapters } from './runtime'
import { getAuthHeaders } from './auth-headers'
import type { ApiResponse } from '../types'
import { DocumentType, JobStatus } from '../types'

function getBaseUrl(): string {
  return getAdapters().env.apiBaseUrl
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

export type ConvertTargetFormat = 'PNG' | 'JPEG' | 'TEXT' | 'PDF' | 'DOCX'

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
  /** S3 key for the canonical Tiptap-JSON edit state. Non-null implies the doc has
   *  been opened in the in-place editor at least once. */
  editStatePath: string | null
  createdAt: string
  updatedAt: string
}

// Spring Page wrapper — pagination metadata is nested under a "page" key
interface SpringPage<T> {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
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
  return data.data.id
}

/**
 * Download a document via the backend's decrypt-then-stream endpoint.
 * Sends auth headers, receives raw bytes, and triggers a download via FileHandlerAdapter.
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

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }

  const blob = await response.blob()
  getAdapters().fileHandler.triggerDownload(blob, fileName)
}

/**
 * Fetch document bytes with auth (e.g. build a `File` for translation from an existing document).
 */
export async function fetchDocumentBlob(idOrPath: string): Promise<Blob> {
  const path = idOrPath.startsWith('/')
    ? idOrPath
    : `/api/v1/documents/${idOrPath}/download`
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }
  return response.blob()
}

/**
 * Programmatically trigger a download from a presigned or public URL.
 * No auth headers — use this for storageUrl (presigned S3) values.
 */
export function triggerDirectDownload(url: string, fileName: string): void {
  getAdapters().fileHandler.triggerDirectDownload(url, fileName)
}

// ─── Generated document export (Draft / Summary / Synopsis / Precedent) ────────

export type GeneratedDocExportFormat = 'PDF' | 'DOCX' | 'MARKDOWN'

function parseFilenameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null
  const utf8 = cd.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) return decodeURIComponent(utf8[1])
  const quoted = cd.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) return quoted[1]
  const plain = cd.match(/filename=([^;]+)/i)
  if (plain?.[1]) return plain[1].trim()
  return null
}

/**
 * Server-side export for AI-generated documents (Draft / Summary / Synopsis / Precedent).
 * Posts HTML body + format to POST /documents/{id}/export and triggers a file save.
 *
 * Use downloadDocument() for raw user-uploaded or toolbox files instead.
 */
export async function exportGeneratedDocument(
  documentId: string,
  format: GeneratedDocExportFormat,
  title: string,
  htmlBody: string,
  markdownBody?: string,
): Promise<void> {
  const fallbackExt = format === 'PDF' ? 'pdf' : format === 'DOCX' ? 'docx' : 'md'
  const fallbackName = `${title.replace(/[^a-z0-9]/gi, '_') || 'document'}.${fallbackExt}`

  const response = await fetch(
    `${getAdapters().env.apiBaseUrl}/api/v1/documents/${documentId}/export`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ format, title, htmlBody, markdownBody }),
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      getAdapters().eventBus.dispatch('auth:session-expired')
      throw new SessionExpiredError()
    }
    let msg = `Export failed: ${response.status}`
    try {
      const err = await response.json() as { message?: string }
      if (err?.message) msg = err.message
    } catch { /* non-JSON body */ }
    throw new ApiError(msg, response.status)
  }

  const blob = await response.blob()
  const filename =
    parseFilenameFromContentDisposition(response.headers.get('content-disposition'))
    ?? fallbackName
  getAdapters().fileHandler.triggerDownload(blob, filename)
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
    total: res.data?.page?.totalElements ?? 0,
    totalPages: res.data?.page?.totalPages ?? 0,
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
 * POST /api/v1/documents with document_type: "TRANSLATION"
 */
export async function submitTranslation(
  docId: string,
  targetLanguage: string,
  opts?: { sourceLanguage?: string; model?: string }
): Promise<DocumentRecord> {
  const body: Record<string, string> = {
    doc_id: docId,
    target_language: targetLanguage.toLowerCase(),
    document_type: 'TRANSLATION',
  }
  if (opts?.sourceLanguage) body.source_language = opts.sourceLanguage.toLowerCase()
  if (opts?.model) body.model = opts.model

  const res = await apiClient.post<ApiResponse<DocumentRecord>>('/api/v1/documents', body)
  return res.data
}

/**
 * Fetch a single document by ID.
 * GET /api/v1/documents/{id} — used to poll translation/generation status.
 */
export async function getDocument(id: string): Promise<DocumentRecord> {
  const res = await apiClient.get<ApiResponse<DocumentRecord>>(`/api/v1/documents/${id}`)
  return res.data
}

// ─── In-place document editor (Tiptap) ────────────────────────────────────

/**
 * Edit state returned by GET /documents/{id}/edit-state.
 *
 * - format='tiptap-json' — content is JSON.stringified Tiptap state (most edits)
 * - format='html'        — content is structured HTML (first open of a PDF/DOCX
 *                          after backend conversion bootstraps it)
 * - format='markdown'    — content is markdown (legacy drafts not yet migrated)
 *
 * `freshConversion=true` only when the backend just produced the bootstrap HTML
 * on this call — the editor uses it to know to immediately persist a Tiptap
 * JSON snapshot so subsequent loads skip the conversion path.
 */
export interface EditStateResponse {
  format: 'tiptap-json' | 'html' | 'markdown'
  content: string
  freshConversion: boolean
}

/** GET /api/v1/documents/{id}/edit-state */
export async function getEditState(documentId: string): Promise<EditStateResponse> {
  const res = await apiClient.get<ApiResponse<EditStateResponse>>(
    `/api/v1/documents/${documentId}/edit-state`,
  )
  return res.data
}

/**
 * PUT /api/v1/documents/{id}/edit-state — autosave the editor's Tiptap JSON.
 * Backend treats `content` as opaque (encrypts and uploads to S3).
 */
export async function updateEditState(documentId: string, content: string): Promise<void> {
  await apiClient.put<ApiResponse<null>>(
    `/api/v1/documents/${documentId}/edit-state`,
    { content },
  )
}

/**
 * POST /api/v1/documents/translate — Sarvam translation for the editor's
 * "Translate selection" action. Language codes are Sarvam BCP-47 (e.g. en-IN).
 */
export interface TranslateTextResponse {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<TranslateTextResponse> {
  const res = await apiClient.post<ApiResponse<TranslateTextResponse>>(
    '/api/v1/documents/translate',
    { text, source_language: sourceLanguage, target_language: targetLanguage },
  )
  return res.data
}

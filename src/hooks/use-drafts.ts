import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { workspaceApi } from '@/services/api/workspace-api'
import { TEMPLATE_TO_SUB_TYPE } from '@/components/cases/case-workspace/draft-creation-wizard'
import type { Draft, CaseDocument } from '@/types'
import { DocumentType, JobStatus } from '@/types'
import type { CreateDraftRequest, DraftListItem } from '@/services/api/document-types'

export type { DocumentType } from '@/services/api/document-types'

const POLL_INTERVAL_MS = 6000
const MAX_POLL_ATTEMPTS = 20

// Normalize API status: backend returns "processing" | "completed" | "failed" (or JobStatus enums)
function normalizeStatus(status: string | undefined | null): 'pending' | 'completed' | 'failed' {
  if (status == null || status === '') return 'pending'
  const s = String(status).toLowerCase()
  if (s === 'completed') return 'completed'
  if (s === 'failed') return 'failed'
  return 'pending'
}

// If draft_body is empty, fetch content using downloadUrl (auth) or signedUrl (direct)
async function resolveDraftBody(
  draft_body: string,
  documentId: string,
  _documentType?: string,
  docUrls?: { downloadUrl?: string | null; signedUrl?: string | null }
): Promise<string> {
  // If draft_body is a URL, fetch from it directly (legacy: unencrypted presigned URL in body)
  if (draft_body && draft_body.startsWith('http')) {
    try {
      const response = await fetch(draft_body)
      return await response.text()
    } catch {
      return ''
    }
  }

  // If draft_body is empty, fetch via authenticated or presigned URL
  if (!draft_body) {
    try {
      return await workspaceApi.fetchDocumentContent({
        id: documentId,
        downloadUrl: docUrls?.downloadUrl,
        signedUrl: docUrls?.signedUrl,
      })
    } catch {
      return ''
    }
  }

  return draft_body || ''
}

// Maps a flat CaseDraftResponse (used by list, single GET, and create endpoints) to Draft
function mapListItemToDraft(item: DraftListItem, resolvedContent?: string): Draft {
  return {
    id: item.id,
    title: item.title || item.metadata?.title || 'Untitled',
    content: resolvedContent ?? item.draft_body ?? '',
    status: normalizeStatus(item.status),
    sections: item.sections || [],
    summary: item.metadata?.summary || '',
    templateType: item.document_type || item.metadata?.document_type,
    contentFormat: (item.content_format as Draft['contentFormat']) || undefined,
    createdAt: new Date(item.created_at),
    updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(item.created_at),
  }
}

// Map a list item, resolving presigned URL content if needed
async function mapListItemToDraftAsync(
  item: DraftListItem,
  docUrls?: { downloadUrl?: string | null; signedUrl?: string | null }
): Promise<Draft> {
  const content = await resolveDraftBody(item.draft_body || '', item.id, item.document_type, docUrls)
  return mapListItemToDraft(item, content)
}

interface UseDraftsResult {
  drafts: Draft[]
  isLoading: boolean
  error: string | null
  createDraft: (
    request: CreateDraftRequest,
    options?: { onDocumentCreated?: (documentId: string) => void },
  ) => Draft
  updateDraftLocal: (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => void
  saveDraftToBackend: (id: string, title?: string, content?: string) => Promise<void>
  deleteDraft: (id: string) => Promise<void>
  getDraft: (id: string) => Draft | undefined
  fetchDraftContent: (id: string) => Promise<Draft | undefined>
  refresh: () => Promise<void>
}

export function useDrafts(caseId: string, documents?: CaseDocument[]): UseDraftsResult {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Polling: jobId → { attempts, draftId }
  // The GET endpoint uses job_id in the URL, but we track which draft.id it belongs to
  // jobId is the polling key (used for GET /documents/{jobId})
  // draftId is the document id (for local state updates)
  const pollingJobsRef = useRef<Map<string, { attempts: number; draftId: string; documentId: string }>>(new Map())
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const caseIdRef = useRef(caseId)
  caseIdRef.current = caseId

  // Dirty tracking for batch backend save
  const dirtyDraftIdsRef = useRef<Set<string>>(new Set())
  const draftsRef = useRef(drafts)
  const documentsRef = useRef(documents)
  draftsRef.current = drafts
  documentsRef.current = documents

  // Stable key so we only refetch when draft list or status actually changes (avoids loop when parent passes new array ref each render)
  const draftListKey = useMemo(
    () =>
      (documents?.filter((d) => d.type === DocumentType.DRAFT) ?? [])
        .map((d) => `${d.id}:${d.jobStatus ?? ''}`)
        .sort()
        .join(','),
    [documents]
  )

  // Poll pending drafts
  const pollPendingDrafts = useCallback(async () => {
    const jobs = pollingJobsRef.current
    if (jobs.size === 0) return

    const toRemove: string[] = []

    for (const [jobId, info] of jobs.entries()) {
      if (info.attempts >= MAX_POLL_ATTEMPTS) {
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === info.draftId ? { ...d, status: 'failed' as const } : d
          )
        )
        toRemove.push(jobId)
        continue
      }

      try {
        // Use documentId for polling (GET /documents/{documentId})
        const docResponse = await workspaceApi.getDocument(caseIdRef.current, info.documentId)
        const doc = docResponse
        // Check jobStatus (new API) or status for completion
        const jobStatus = doc.jobStatus
        const normalizedStatus = normalizeStatus(jobStatus)

        if (normalizedStatus === 'completed') {
          // Fetch content via authenticated or presigned URL
          let resolvedContent = ''
          try {
            resolvedContent = await workspaceApi.fetchDocumentContent({
              id: info.documentId,
              downloadUrl: doc.downloadUrl,
              signedUrl: doc.signedUrl,
            })
          } catch {
            // Content fetch failed, leave empty
          }

          // Map the new document response to Draft format
          const resolvedDraft = await mapListItemToDraftAsync({
            id: info.documentId,
            job_id: jobId,
            title: doc.name || 'Untitled',
            document_type: doc.subType || '',
            status: 'completed',
            draft_body: resolvedContent,
            sections: [],
            metadata: {
              document_type: doc.subType || '',
              title: doc.name || 'Untitled',
              summary: '',
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            completed_at: null,
          }, { downloadUrl: doc.downloadUrl, signedUrl: doc.signedUrl })
          setDrafts((prev) =>
            prev.map((d) => (d.id === info.draftId ? resolvedDraft : d))
          )
          toRemove.push(jobId)
        } else if (normalizedStatus === 'failed') {
          setDrafts((prev) =>
            prev.map((d) =>
              d.id === info.draftId ? { ...d, status: 'failed' as const } : d
            )
          )
          toRemove.push(jobId)
        } else {
          jobs.set(jobId, { ...info, attempts: info.attempts + 1 })
        }
      } catch {
        jobs.set(jobId, { ...info, attempts: info.attempts + 1 })
      }
    }

    for (const id of toRemove) {
      jobs.delete(id)
    }

    if (jobs.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  const ensurePolling = useCallback(() => {
    if (!pollingIntervalRef.current && pollingJobsRef.current.size > 0) {
      pollingIntervalRef.current = setInterval(pollPendingDrafts, POLL_INTERVAL_MS)
    }
  }, [pollPendingDrafts])

  // Cleanup polling on unmount or caseId change
  useEffect(() => {
    return () => {
      pollingJobsRef.current.clear()
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [caseId])

  // Flush all dirty drafts to backend via the authenticated API (with S3 upload)
  const flushDirtyDrafts = useCallback(async () => {
    const dirtyIds = dirtyDraftIdsRef.current
    if (dirtyIds.size === 0) return

    for (const id of Array.from(dirtyIds)) {
      const draft = draftsRef.current.find((d) => d.id === id)
      if (draft && draft.status === 'completed') {
        try {
          // Skip S3 upload for empty content
          if (!draft.content.trim()) {
            await workspaceApi.updateDocument(caseIdRef.current, id, { name: draft.title })
            dirtyIds.delete(id)
            continue
          }

          // Get presigned URL for the EXISTING document (don't create a new one)
          const fileName = `${id}.html`
          const contentBytes = new Blob([draft.content]).size
          const { uploadUrl, storageKey } = await workspaceApi.getPresignedUploadUrlForExisting(id, fileName, contentBytes)

          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'text/html' },
            body: draft.content,
          })

          // Update with storage key
          await workspaceApi.updateDocument(caseIdRef.current, id, {
            name: draft.title,
            storage_key: storageKey,
          })

          dirtyIds.delete(id)
        } catch (err) {
          console.error('Flush save failed for draft:', id, err)
        }
      }
    }
  }, [])

  // Batch save dirty drafts to backend every 30 seconds
  useEffect(() => {
    const batchSaveInterval = setInterval(flushDirtyDrafts, 30 * 1000)

    // On page close, fire-and-forget save via authenticated API
    const handleBeforeUnload = () => {
      flushDirtyDrafts()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(batchSaveInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // On cleanup (e.g. navigating away from case), flush dirty drafts
      flushDirtyDrafts()
    }
  }, [caseId, flushDirtyDrafts])

  // Lazily fetch content for a single draft by ID (called on click)
  const fetchDraftContent = useCallback(async (id: string): Promise<Draft | undefined> => {
    const draft = draftsRef.current.find((d) => d.id === id)
    if (!draft || draft.content) return draft // Already has content

    try {
      const caseDoc = documentsRef.current?.find((d) => d.id === id)
      const content = await workspaceApi.fetchDocumentContent({
        id,
        downloadUrl: caseDoc?.downloadUrl,
        signedUrl: caseDoc?.signedUrl,
      })
      const updated = { ...draft, content }
      setDrafts((prev) =>
        prev.map((d) => d.id === id ? { ...d, content } : d)
      )
      return updated
    } catch {
      console.error('Failed to fetch draft content:', id)
    }
    return draft
  }, [])

  const fetchDrafts = useCallback(async () => {
    const docs = documentsRef.current
    // Don't fetch from separate API - always use documents passed from useCaseDocuments
    // If no documents provided, set empty drafts
    if (!docs) {
      setDrafts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Filter documents for DRAFT type
      const draftDocs = docs.filter((d) => d.type === DocumentType.DRAFT)

      // Map to Draft objects without eagerly fetching content — content is loaded on click
      const mapped: Draft[] = draftDocs.map((doc) => {
        const existing = draftsRef.current.find((d) => d.id === doc.id)
        return {
          id: doc.id,
          title: doc.name || 'Untitled Draft',
          content: existing?.content || '', // Keep cached content, don't fetch new
          status: doc.jobStatus === JobStatus.COMPLETED ? 'completed' : doc.jobStatus === JobStatus.FAILED ? 'failed' : 'pending',
          sections: [],
          summary: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      setDrafts(mapped)

      // Start polling for drafts that are still processing
      for (const doc of draftDocs) {
        if (doc.jobStatus === JobStatus.PROCESSING) {
          pollingJobsRef.current.set(doc.jobId || doc.id, {
            attempts: 0,
            draftId: doc.id,
            documentId: doc.id,
          })
        }
      }
      ensurePolling()
      void pollPendingDrafts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch drafts'
      setError(message)
      console.error('Failed to fetch drafts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId, ensurePolling, pollPendingDrafts])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts, draftListKey])

  // Create draft: POST → insert placeholder → poll → content fills in
  const createDraft = useCallback((request: CreateDraftRequest, options?: { onDocumentCreated?: (documentId: string) => void }): Draft => {
    const placeholderId = `pending-${Date.now()}`

    const placeholder: Draft = {
      id: placeholderId,
      title: request.title || 'Generating...',
      content: '',
      status: 'pending',
      sections: [],
      summary: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setDrafts((prev) => [placeholder, ...prev])

    // Build the new unified document API request
    // Determine sub_type: use request.subtype if provided, otherwise try mapping from document_type
    const documentTypeStr = request.document_type.toLowerCase()
    let subType = request.subtype || ''

    // If no subtype provided, try to get it from TEMPLATE_TO_SUB_TYPE mapping
    if (!subType) {
      // Find matching template key from document_type (e.g., 'bail_application' -> 'bail-application')
      const templateKey = Object.keys(TEMPLATE_TO_SUB_TYPE).find(
        key => TEMPLATE_TO_SUB_TYPE[key].toLowerCase() === documentTypeStr ||
               key.replace(/-/g, '_') === documentTypeStr
      )
      if (templateKey) {
        subType = TEMPLATE_TO_SUB_TYPE[templateKey]
      }
    }

    const documentRequest = {
      document_type: 'draft' as const,
      sub_type: subType,
      data: {
        title: request.title,
        document_type: request.document_type,
        input_mode: request.input_mode,
        ...(request.freetext_body && { freetext_body: request.freetext_body }),
        ...(request.file_ids?.length && { file_ids: request.file_ids }),
        ...(request.language && { language: request.language }),
        ...(request.config && { config: request.config }),
      },
    }

    workspaceApi.createDocument(caseId, documentRequest).then((createResponse) => {
      const draftId = createResponse.id
      const jobId = createResponse.jobId || draftId

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === placeholderId ? { ...d, id: draftId } : d
        )
      )

      options?.onDocumentCreated?.(draftId)

      // Poll using jobId (new API returns jobId for polling)
      pollingJobsRef.current.set(jobId, { attempts: 0, draftId, documentId: draftId })
      ensurePolling()
      // First poll immediately (setInterval waits POLL_INTERVAL_MS before first tick)
      void pollPendingDrafts()
    }).catch(() => {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === placeholderId ? { ...d, status: 'failed' as const } : d
        )
      )
    })

    return placeholder
  }, [caseId, ensurePolling, pollPendingDrafts])

  // Update draft in local state only (no backend call)
  const updateDraftLocal = useCallback((id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id
          ? { ...draft, ...updates, updatedAt: new Date(), ...(updates.content !== undefined ? { sections: [] } : {}) }
          : draft
      )
    )
    dirtyDraftIdsRef.current.add(id)
  }, [])

  // Persist a single draft to backend
  // When title/content are provided, use them directly (avoids stale ref race condition).
  // When omitted (e.g. batch save), fall back to draftsRef.
  const saveDraftToBackend = useCallback(async (id: string, title?: string, content?: string) => {
    const resolvedTitle = title ?? draftsRef.current.find((d) => d.id === id)?.title
    const resolvedContent = content ?? draftsRef.current.find((d) => d.id === id)?.content
    if (resolvedTitle === undefined || resolvedContent === undefined) return

    // Clear dirty flag immediately so flushDirtyDrafts won't re-send stale content
    // if it runs concurrently (e.g. during unmount cleanup race).
    dirtyDraftIdsRef.current.delete(id)

    try {
      // Skip S3 upload for empty content - just update title
      if (!resolvedContent.trim()) {
        await workspaceApi.updateDocument(caseId, id, { name: resolvedTitle })
        return
      }

      // Get presigned URL for the EXISTING document (don't create a new one)
      const fileName = `${id}.html`
      const contentBytes = new Blob([resolvedContent]).size
      const { uploadUrl, storageKey } = await workspaceApi.getPresignedUploadUrlForExisting(id, fileName, contentBytes)

      // Upload content to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/html' },
        body: resolvedContent,
      })

      // Update draft with storage key
      await workspaceApi.updateDocument(caseId, id, {
        name: resolvedTitle,
        storage_key: storageKey,
      })
    } catch (error) {
      // Re-mark as dirty so batch save retries later
      dirtyDraftIdsRef.current.add(id)
      console.error('Failed to save draft to backend:', error)
      setError('Failed to save draft. Will retry automatically.')
    }
  }, [caseId])

  const deleteDraft = useCallback(async (id: string) => {
    // Stop polling if this draft was being polled
    for (const [jobId, info] of pollingJobsRef.current.entries()) {
      if (info.draftId === id) {
        pollingJobsRef.current.delete(jobId)
        break
      }
    }

    try {
      await workspaceApi.deleteCaseDocument(caseId, id)
    } catch {
      // job may already be completed — safe to ignore
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }, [caseId])

  const getDraft = useCallback(
    (id: string): Draft | undefined => drafts.find((draft) => draft.id === id),
    [drafts]
  )

  return {
    drafts,
    isLoading,
    error,
    createDraft,
    updateDraftLocal,
    saveDraftToBackend,
    deleteDraft,
    getDraft,
    fetchDraftContent,
    refresh: fetchDrafts,
  }
}

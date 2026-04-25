import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { buildDocumentPayload } from '@knowlex/core/api/draft-helpers'
import type { Draft, CaseDocument } from '@knowlex/core/types'
import { DocumentType, JobStatus } from '@knowlex/core/types'
import type { CreateDraftRequest } from '@knowlex/core/api/document-types'

export type { DocumentType } from '@knowlex/core/api/document-types'

// Normalize API status: backend returns "processing" | "completed" | "failed" (or JobStatus enums)
function normalizeStatus(status: string | undefined | null): 'pending' | 'completed' | 'failed' {
  if (status == null || status === '') return 'pending'
  const s = String(status).toLowerCase()
  if (s === 'completed') return 'completed'
  if (s === 'failed') return 'failed'
  return 'pending'
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

  // Active status pollers: documentId → AbortController
  const streamsRef = useRef<Map<string, AbortController>>(new Map())
  const caseIdRef = useRef(caseId)
  caseIdRef.current = caseId

  // Dirty tracking for batch backend save
  const dirtyDraftIdsRef = useRef<Set<string>>(new Set())
  const draftsRef = useRef(drafts)
  const documentsRef = useRef(documents)
  draftsRef.current = drafts
  documentsRef.current = documents

  const isStudioGenerativeDoc = useCallback(
    (d: CaseDocument) => d.type === DocumentType.DRAFT || d.type === DocumentType.TRANSLATION,
    []
  )

  // Stable key so we only refetch when draft/translation list or status actually changes
  const draftListKey = useMemo(
    () =>
      (documents?.filter(isStudioGenerativeDoc) ?? [])
        .map((d) => `${d.id}:${d.jobStatus ?? ''}`)
        .sort()
        .join(','),
    [documents, isStudioGenerativeDoc]
  )

  const startStream = useCallback((documentId: string) => {
    if (streamsRef.current.has(documentId)) return

    const reconcilePendingFromRest = async () => {
      if (draftsRef.current.find((d) => d.id === documentId)?.status !== 'pending') return
      try {
        const doc = await workspaceApi.getDocument(caseIdRef.current, documentId)
        const finalStatus = normalizeStatus(
          (doc as { jobStatus?: string; status?: string }).jobStatus
            ?? (doc as { jobStatus?: string; status?: string }).status
        )
        if (finalStatus === 'completed') {
          const d0 = draftsRef.current.find((d) => d.id === documentId)
          if (d0?.sourceDocumentType === DocumentType.TRANSLATION) {
            setDrafts((prev) => prev.map((d) =>
              d.id === documentId ? { ...d, status: 'completed' as const } : d
            ))
            return
          }
          let resolvedContent = ''
          try {
            resolvedContent = await workspaceApi.fetchDocumentContent({
              id: documentId,
              downloadUrl: doc.downloadUrl,
              signedUrl: doc.signedUrl,
            })
          } catch { /* leave empty */ }
          setDrafts((prev) => prev.map((d) =>
            d.id === documentId
              ? { ...d, status: 'completed' as const, content: resolvedContent }
              : d
          ))
        } else if (finalStatus === 'failed') {
          setDrafts((prev) => prev.map((d) =>
            d.id === documentId ? { ...d, status: 'failed' as const } : d
          ))
        }
      } catch { /* ignore */ }
    }

    const ctrl = workspaceApi.pollDocumentStatus(documentId, {
      onStatus: async (doc) => {
        const normalizedStatus = normalizeStatus(
          (doc as { jobStatus?: string; status?: string }).jobStatus
            ?? (doc as { jobStatus?: string; status?: string }).status
        )
        if (normalizedStatus === 'completed') {
          const existing = draftsRef.current.find((d) => d.id === documentId)
          if (existing?.sourceDocumentType === DocumentType.TRANSLATION) {
            setDrafts((prev) => prev.map((d) =>
              d.id === documentId ? { ...d, status: 'completed' as const } : d
            ))
            return
          }
          let resolvedContent = ''
          try {
            resolvedContent = await workspaceApi.fetchDocumentContent({
              id: documentId,
              downloadUrl: doc.downloadUrl,
              signedUrl: doc.signedUrl,
            })
          } catch { /* leave empty, user can still view via download */ }
          setDrafts((prev) => prev.map((d) =>
            d.id === documentId
              ? { ...d, status: 'completed' as const, content: resolvedContent }
              : d
          ))
        } else if (normalizedStatus === 'failed') {
          setDrafts((prev) => prev.map((d) =>
            d.id === documentId ? { ...d, status: 'failed' as const } : d
          ))
        }
      },
      onError: () => {
        streamsRef.current.delete(documentId)
        // fetch() can call onError without onEnd; reconcile in case the job already finished
        void reconcilePendingFromRest()
      },
      onEnd: () => {
        streamsRef.current.delete(documentId)
        void reconcilePendingFromRest()
      },
    })
    streamsRef.current.set(documentId, ctrl)
  }, [])

  const stopStream = useCallback((documentId: string) => {
    streamsRef.current.get(documentId)?.abort()
    streamsRef.current.delete(documentId)
  }, [])

  // Cleanup streams on unmount or caseId change
  useEffect(() => {
    return () => {
      for (const ctrl of streamsRef.current.values()) ctrl.abort()
      streamsRef.current.clear()
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
      // Drafts + translations (both are generated jobs and appear in Case Studio activity)
      const draftDocs = docs.filter((d) => isStudioGenerativeDoc(d))

      // Map to Draft objects without eagerly fetching content — content is loaded on click
      const mapped: Draft[] = draftDocs.map((doc) => {
        const existing = draftsRef.current.find((d) => d.id === doc.id)
        const defaultTitle = doc.type === DocumentType.TRANSLATION
          ? (doc.name || 'Translation')
          : (doc.name || 'Untitled Draft')
        return {
          id: doc.id,
          title: existing?.title || defaultTitle,
          content: existing?.content || '', // Keep cached content, don't fetch new
          status: doc.jobStatus === JobStatus.COMPLETED ? 'completed' : doc.jobStatus === JobStatus.FAILED ? 'failed' : 'pending',
          sections: [],
          summary: '',
          sourceDocumentType: doc.type,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        }
      })

      setDrafts(mapped)

      // Start status pollers for drafts still processing
      for (const doc of draftDocs) {
        if (doc.jobStatus === JobStatus.PROCESSING) {
          startStream(doc.id)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch drafts'
      setError(message)
      console.error('Failed to fetch drafts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId, startStream, isStudioGenerativeDoc])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts, draftListKey])

  // Create draft: POST → insert placeholder → open SSE stream → content fills in
  const createDraft = useCallback((request: CreateDraftRequest, options?: { onDocumentCreated?: (documentId: string) => void }): Draft => {
    const placeholderId = `pending-${Date.now()}`

    const placeholder: Draft = {
      id: placeholderId,
      title: request.title || 'Generating...',
      content: '',
      status: 'pending',
      sections: [],
      summary: '',
      sourceDocumentType: DocumentType.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setDrafts((prev) => [placeholder, ...prev])

    const documentRequest = buildDocumentPayload(request)

    workspaceApi.createDocument(caseId, documentRequest).then((createResponse) => {
      const draftId = createResponse.id

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === placeholderId ? { ...d, id: draftId } : d
        )
      )

      options?.onDocumentCreated?.(draftId)
      startStream(draftId)
    }).catch(() => {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === placeholderId ? { ...d, status: 'failed' as const } : d
        )
      )
    })

    return placeholder
  }, [caseId, startStream])

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
    stopStream(id)
    try {
      await workspaceApi.deleteDocuments([id])
    } catch {
      // job may already be completed — safe to ignore
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }, [stopStream])

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

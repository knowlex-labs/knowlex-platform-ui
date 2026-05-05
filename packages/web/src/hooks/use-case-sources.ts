import { useState, useCallback, useEffect, useRef } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { DocumentType, GENERATED_DOC_TYPES, IndexingStatus, JobStatus, type CaseDocument } from '@knowlex/core/types'

export const SOURCE_PAGE_SIZE = 20

interface UseCaseDocumentsResult {
  /** Non-source documents: DRAFT, SUMMARY */
  documents: CaseDocument[]
  /** Current page of sources (USER_UPLOADED + JUDGMENT) */
  paginatedSources: CaseDocument[]
  sourcePage: number
  sourceTotal: number
  setSourcePage: (page: number) => void
  selectedSourceIds: Set<string>
  isLoading: boolean
  isSourcesLoading: boolean
  isUploading: boolean
  error: string | null
  toggleSourceSelection: (sourceId: string) => void
  /** Select specific IDs (e.g. all visible filtered items) */
  selectAllSources: (ids: string[]) => void
  deselectAllSources: () => void
  uploadFile: (file: File) => Promise<void>
  deleteSource: (sourceId: string) => Promise<void>
  linkContent: (sourceId: string) => Promise<void>
  renameDocument: (documentId: string, newName: string) => Promise<void>
  batchDelete: (sourceIds: string[]) => Promise<void>
  batchLinkContent: (sourceIds: string[]) => Promise<void>
  refresh: () => Promise<void>
}

export function useCaseDocuments(caseId: string | null): UseCaseDocumentsResult {
  // Non-source docs (DRAFT / SUMMARY) — fetched all at once
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  // Paginated sources (USER_UPLOADED + JUDGMENT)
  const [paginatedSources, setPaginatedSources] = useState<CaseDocument[]>([])
  const [sourcePage, setSourcePageState] = useState(1)
  const [sourceTotal, setSourceTotal] = useState(0)
  const [isSourcesLoading, setIsSourcesLoading] = useState(false)

  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track active SSE streams: documentId -> AbortController
  const streamsRef = useRef<Map<string, AbortController>>(new Map())

  const applyDocUpdate = useCallback((doc: { id: string; jobStatus?: string; indexingStatus?: string; status?: string; type?: string }) => {
    // SSE / REST: prefer `jobStatus` for async jobs, fall back to `status` (names vary by path).
    // If the event omits `type` (rare), infer from the row we already have so we never drop a terminal state.
    const mapRow = (prev: CaseDocument) => {
      if (prev.id !== doc.id) return prev
      const effectiveType = (doc.type ?? prev.type) as DocumentType
      const isGenerated = effectiveType && GENERATED_DOC_TYPES.has(effectiveType)
      const jobVal = (doc.jobStatus ?? doc.status) as string | undefined
      if (isGenerated) {
        if (!jobVal) return prev
        return { ...prev, jobStatus: jobVal as JobStatus }
      }
      const resolvedIndexingStatus = (doc.indexingStatus || doc.status) as IndexingStatus
      if (!resolvedIndexingStatus) return prev
      return { ...prev, indexingStatus: resolvedIndexingStatus }
    }
    setDocuments((prev) => prev.map(mapRow))
    setPaginatedSources((prev) => prev.map(mapRow))
  }, [])

  const reconcileDocument = useCallback(
    (documentId: string) => {
      if (!caseId) return
      workspaceApi
        .getDocument(caseId, documentId)
        .then((d) => {
          applyDocUpdate({
            id: d.id,
            type: d.type,
            jobStatus: d.jobStatus,
            status: d.status,
            indexingStatus: d.indexingStatus,
          })
        })
        .catch(() => { /* may be deleted */ })
    },
    [caseId, applyDocUpdate]
  )

  const startPolling = useCallback((documentId: string) => {
    if (streamsRef.current.has(documentId)) return
    const ctrl = workspaceApi.pollDocumentStatus(documentId, {
      onStatus: (doc) => applyDocUpdate(doc),
      onError: () => {
        streamsRef.current.delete(documentId)
        // fetch() may not call onEnd when the stream errors — reconcile once from REST
        reconcileDocument(documentId)
      },
      onEnd: () => {
        streamsRef.current.delete(documentId)
        // Re-fetch final status — stream may close before a terminal event is delivered
        reconcileDocument(documentId)
      },
    })
    streamsRef.current.set(documentId, ctrl)
  }, [applyDocUpdate, reconcileDocument])

  const stopPolling = useCallback((documentId: string) => {
    streamsRef.current.get(documentId)?.abort()
    streamsRef.current.delete(documentId)
  }, [])

  const stopAllPolling = useCallback(() => {
    for (const ctrl of streamsRef.current.values()) ctrl.abort()
    streamsRef.current.clear()
  }, [])

  // Fetch non-source docs (DRAFT / SUMMARY) once per caseId
  useEffect(() => {
    stopAllPolling()
    if (!caseId) { setDocuments([]); setSelectedSourceIds(new Set()); return }

    const fetch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const docs = await workspaceApi.getCaseDocuments(caseId)
        const nonSources = docs.filter(
          (d) => d.type !== DocumentType.USER_UPLOADED && d.type !== DocumentType.JUDGMENT,
        )
        setDocuments(nonSources)

        // Poll any in-progress non-source docs
        for (const doc of nonSources) {
          const isDraftOrSummary = GENERATED_DOC_TYPES.has(doc.type as DocumentType)
          const status = isDraftOrSummary ? doc.jobStatus : doc.indexingStatus
          if (status === IndexingStatus.RUNNING || status === IndexingStatus.PENDING || status === JobStatus.PROCESSING) {
            startPolling(doc.id)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch documents')
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
    return () => { stopAllPolling() }
  }, [caseId, startPolling, stopAllPolling])

  // refresh() or createDocument can add new GENERATED rows after the caseId effect ran — open SSE for those jobs.
  useEffect(() => {
    if (!caseId) return
    for (const doc of documents) {
      if (GENERATED_DOC_TYPES.has(doc.type as DocumentType) && doc.jobStatus === JobStatus.PROCESSING) {
        startPolling(doc.id)
      }
    }
  }, [caseId, documents, startPolling])

  // Fetch paginated sources (USER_UPLOADED + JUDGMENT) when caseId or page changes
  useEffect(() => {
    if (!caseId) { setPaginatedSources([]); setSourceTotal(0); return }

    const fetch = async () => {
      setIsSourcesLoading(true)
      try {
        const { documents: docs, total } = await workspaceApi.getCaseDocumentsPaginated(caseId, {
          page: sourcePage,
          limit: SOURCE_PAGE_SIZE,
        })
        setPaginatedSources(docs)
        setSourceTotal(total)

        // Auto-select all on first page load
        if (sourcePage === 1) {
          setSelectedSourceIds((prev) => {
            const next = new Set(prev)
            docs.forEach((d) => next.add(d.id))
            return next
          })
        }

        // Poll in-progress sources
        for (const doc of docs) {
          if (doc.indexingStatus === IndexingStatus.RUNNING || doc.indexingStatus === IndexingStatus.PENDING) {
            startPolling(doc.id)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sources')
      } finally {
        setIsSourcesLoading(false)
      }
    }

    fetch()
  }, [caseId, sourcePage, startPolling])

  const setSourcePage = useCallback((page: number) => {
    setSourcePageState(page)
  }, [])

  const toggleSourceSelection = useCallback((sourceId: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(sourceId)) { next.delete(sourceId) } else { next.add(sourceId) }
      return next
    })
  }, [])

  const selectAllSources = useCallback((ids: string[]) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [])

  const deselectAllSources = useCallback(() => {
    setSelectedSourceIds(new Set())
  }, [])

  const uploadFile = useCallback(async (file: File) => {
    if (!caseId) return
    setIsUploading(true)
    setError(null)

    const tempId = `pending-${Date.now()}`
    const placeholder: CaseDocument = {
      id: tempId,
      name: file.name,
      type: DocumentType.USER_UPLOADED,
      indexingStatus: IndexingStatus.PENDING,
      originalFilename: file.name,
      fileType: file.type,
      createdAt: new Date().toISOString(),
    }
    setPaginatedSources((prev) => [placeholder, ...prev])
    setSourceTotal((t) => t + 1)
    setSelectedSourceIds((prev) => new Set([...prev, tempId]))

    try {
      const { id: documentId } = await workspaceApi.uploadDocument(caseId, file)
      setPaginatedSources((prev) => prev.map((d) => d.id === tempId ? { ...d, id: documentId } : d))
      setSelectedSourceIds((prev) => {
        const next = new Set(prev)
        next.delete(tempId)
        next.add(documentId)
        return next
      })
      startPolling(documentId)
    } catch (err) {
      setPaginatedSources((prev) => prev.filter((d) => d.id !== tempId))
      setSourceTotal((t) => Math.max(0, t - 1))
      setSelectedSourceIds((prev) => { const next = new Set(prev); next.delete(tempId); return next })
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [caseId, startPolling])

  const deleteSource = useCallback(async (sourceId: string) => {
    try {
      stopPolling(sourceId)
      await workspaceApi.deleteDocuments([sourceId])
      setPaginatedSources((prev) => prev.filter((d) => d.id !== sourceId))
      setSourceTotal((t) => Math.max(0, t - 1))
      setSelectedSourceIds((prev) => { const next = new Set(prev); next.delete(sourceId); return next })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete source')
      throw err
    }
  }, [stopPolling, caseId])

  const linkContent = useCallback(async (sourceId: string) => {
    try {
      const updatedDoc = await workspaceApi.triggerIndexing(caseId!, sourceId)
      setDocuments((prev) => prev.map((d) => d.id === sourceId ? updatedDoc : d))
      setPaginatedSources((prev) => prev.map((d) => d.id === sourceId ? updatedDoc : d))
      const status = GENERATED_DOC_TYPES.has(updatedDoc.type)
        ? updatedDoc.jobStatus : updatedDoc.indexingStatus
      if (status === IndexingStatus.RUNNING || status === IndexingStatus.PENDING || status === JobStatus.PROCESSING) {
        startPolling(sourceId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link content')
      throw err
    }
  }, [caseId, startPolling])

  const renameDocument = useCallback(async (documentId: string, newName: string) => {
    if (!caseId) return
    try {
      await workspaceApi.updateDocument(caseId, documentId, { name: newName })
      setDocuments((prev) => prev.map((d) => d.id === documentId ? { ...d, name: newName } : d))
      setPaginatedSources((prev) => prev.map((d) => d.id === documentId ? { ...d, name: newName } : d))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename document')
      throw err
    }
  }, [caseId])

  const batchDelete = useCallback(async (sourceIds: string[]) => {
    try {
      for (const id of sourceIds) stopPolling(id)
      await workspaceApi.deleteDocuments(sourceIds)
      setPaginatedSources((prev) => prev.filter((d) => !sourceIds.includes(d.id)))
      setSourceTotal((t) => Math.max(0, t - sourceIds.length))
      setSelectedSourceIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sources')
      throw err
    }
  }, [stopPolling])

  const batchLinkContent = useCallback(async (sourceIds: string[]) => {
    try {
      await workspaceApi.batchTriggerIndexing(caseId!, sourceIds)
      setPaginatedSources((prev) =>
        prev.map((d) => sourceIds.includes(d.id) ? { ...d, indexingStatus: IndexingStatus.PENDING } : d)
      )
      for (const id of sourceIds) startPolling(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-index sources')
      throw err
    }
  }, [caseId, startPolling])

  const refresh = useCallback(async () => {
    if (!caseId) return
    try {
      const [nonSourceDocs, { documents: sourceDocs, total }] = await Promise.all([
        workspaceApi.getCaseDocuments(caseId),
        workspaceApi.getCaseDocumentsPaginated(caseId, { page: sourcePage, limit: SOURCE_PAGE_SIZE }),
      ])
      setDocuments(nonSourceDocs.filter((d) => d.type !== 'USER_UPLOADED' && d.type !== 'JUDGMENT'))
      setPaginatedSources(sourceDocs)
      setSourceTotal(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    }
  }, [caseId, sourcePage])

  return {
    documents,
    paginatedSources,
    sourcePage,
    sourceTotal,
    setSourcePage,
    selectedSourceIds,
    isLoading,
    isSourcesLoading,
    isUploading,
    error,
    toggleSourceSelection,
    selectAllSources,
    deselectAllSources,
    uploadFile,
    deleteSource,
    linkContent,
    renameDocument,
    batchDelete,
    batchLinkContent,
    refresh,
  }
}

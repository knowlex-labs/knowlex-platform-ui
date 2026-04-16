import { useState, useCallback, useEffect, useRef } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { DocumentType, GENERATED_DOC_TYPES, IndexingStatus, JobStatus, type CaseDocument, type CaseDocumentStatus } from '@knowlex/core/types'

const POLLING_INTERVAL = 6000 // 6 seconds
const MAX_POLL_ATTEMPTS = 20
export const SOURCE_PAGE_SIZE = 20

interface UseCaseDocumentsResult {
  /** Non-source documents: DRAFT, SUMMARY, JUDGMENT */
  documents: CaseDocument[]
  /** Current page of USER_UPLOADED sources */
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
  // Non-source docs (DRAFT / SUMMARY / JUDGMENT) — fetched all at once
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  // Paginated USER_UPLOADED sources
  const [paginatedSources, setPaginatedSources] = useState<CaseDocument[]>([])
  const [sourcePage, setSourcePageState] = useState(1)
  const [sourceTotal, setSourceTotal] = useState(0)
  const [isSourcesLoading, setIsSourcesLoading] = useState(false)

  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track documents being polled: documentId -> attempts count
  const pollingAttemptsRef = useRef<Map<string, number>>(new Map())
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pollIndexingStatus = useCallback(async () => {
    if (!caseId) return

    const idsToRemove: string[] = []

    for (const [documentId, attempts] of pollingAttemptsRef.current) {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        console.warn(`Polling max attempts reached for document ${documentId}`)
        idsToRemove.push(documentId)
        continue
      }

      try {
        const doc = await workspaceApi.getDocument(caseId, documentId)
        const isDraftOrSummary = GENERATED_DOC_TYPES.has(doc.type as DocumentType)
        const status = isDraftOrSummary
          ? doc.jobStatus as CaseDocumentStatus
          : doc.indexingStatus as CaseDocumentStatus

        const update = isDraftOrSummary
          ? { jobStatus: doc.jobStatus as JobStatus }
          : { indexingStatus: doc.indexingStatus as IndexingStatus }

        // Update in non-source docs
        setDocuments((prev) => prev.map((d) => d.id === documentId ? { ...d, ...update } : d))
        // Update in paginated sources
        setPaginatedSources((prev) => prev.map((d) => d.id === documentId ? { ...d, ...update } : d))

        const isCompleted = status === IndexingStatus.COMPLETED || status === JobStatus.COMPLETED
        const isFailed = status === IndexingStatus.FAILED || status === JobStatus.FAILED
        if (isCompleted || isFailed) {
          idsToRemove.push(documentId)
        } else {
          pollingAttemptsRef.current.set(documentId, attempts + 1)
        }
      } catch {
        idsToRemove.push(documentId)
      }
    }

    for (const id of idsToRemove) pollingAttemptsRef.current.delete(id)

    if (pollingAttemptsRef.current.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [caseId])

  const startPolling = useCallback((documentId: string) => {
    if (!pollingAttemptsRef.current.has(documentId)) {
      pollingAttemptsRef.current.set(documentId, 0)
    }
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(pollIndexingStatus, POLLING_INTERVAL)
    }
  }, [pollIndexingStatus])

  const stopPolling = useCallback((documentId: string) => {
    pollingAttemptsRef.current.delete(documentId)
    if (pollingAttemptsRef.current.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  const stopAllPolling = useCallback(() => {
    pollingAttemptsRef.current.clear()
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Fetch non-source docs (DRAFT / SUMMARY / JUDGMENT) once per caseId
  useEffect(() => {
    stopAllPolling()
    if (!caseId) { setDocuments([]); setSelectedSourceIds(new Set()); return }

    const fetch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const docs = await workspaceApi.getCaseDocuments(caseId)
        const nonSources = docs.filter((d) => d.type !== DocumentType.USER_UPLOADED)
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

  // Fetch paginated USER_UPLOADED sources when caseId or page changes
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
    try {
      const { id: documentId } = await workspaceApi.uploadDocument(caseId, file)
      const newDoc = await workspaceApi.getDocument(caseId, documentId)
      // Prepend to paginated sources and bump total
      setPaginatedSources((prev) => [newDoc as unknown as CaseDocument, ...prev])
      setSourceTotal((t) => t + 1)
      setSelectedSourceIds((prev) => new Set([...prev, documentId]))
      startPolling(documentId)
    } catch (err) {
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
      setDocuments(nonSourceDocs.filter((d) => d.type !== 'USER_UPLOADED'))
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

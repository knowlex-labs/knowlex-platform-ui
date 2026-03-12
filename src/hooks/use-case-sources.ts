import { useState, useCallback, useEffect, useRef } from 'react'
import { workspaceApi } from '@/services/api/workspace-api'
import { IndexingStatus, JobStatus, type CaseDocument, type CaseDocumentStatus } from '@/types'

const POLLING_INTERVAL = 6000 // 6 seconds
const MAX_POLL_ATTEMPTS = 20

interface UseCaseDocumentsResult {
  documents: CaseDocument[]
  selectedSourceIds: Set<string>
  isLoading: boolean
  isUploading: boolean
  error: string | null
  toggleSourceSelection: (sourceId: string) => void
  selectAllSources: () => void
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
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track documents being polled: documentId -> attempts count
  const pollingAttemptsRef = useRef<Map<string, number>>(new Map())
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll job status for documents
  const pollIndexingStatus = useCallback(async () => {
    if (!caseId) return

    const idsToRemove: string[] = []

    for (const [documentId, attempts] of pollingAttemptsRef.current) {
      // Stop polling if max attempts reached
      if (attempts >= MAX_POLL_ATTEMPTS) {
        console.warn(`Polling max attempts reached for document ${documentId}`)
        idsToRemove.push(documentId)
        continue
      }

      try {
        const doc = await workspaceApi.getDocument(caseId, documentId)
        const docType = doc.type as 'USER_UPLOADED' | 'DRAFT' | 'JUDGMENT' | 'SUMMARY'

        // Use jobStatus for DRAFT and SUMMARY, indexingStatus for USER_UPLOADED and JUDGMENT
        const isDraftOrSummary = docType === 'DRAFT' || docType === 'SUMMARY'
        const status = isDraftOrSummary
          ? doc.jobStatus as CaseDocumentStatus
          : doc.indexingStatus as CaseDocumentStatus

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  ...(isDraftOrSummary
                    ? { jobStatus: doc.jobStatus as JobStatus }
                    : { indexingStatus: doc.indexingStatus as IndexingStatus }),
                }
              : d
          )
        )

        // Stop polling if terminal status (completed/failed for either enum)
        const isCompleted = status === IndexingStatus.COMPLETED || status === JobStatus.COMPLETED
        const isFailed = status === IndexingStatus.FAILED || status === JobStatus.FAILED
        if (isCompleted || isFailed) {
          idsToRemove.push(documentId)
        } else {
          // Increment attempts for non-terminal documents
          pollingAttemptsRef.current.set(documentId, attempts + 1)
        }
      } catch (error) {
        // Document may have been deleted, stop polling
        console.error('Polling job status error:', error)
        idsToRemove.push(documentId)
      }
    }

    // Remove terminal documents from polling
    for (const id of idsToRemove) {
      pollingAttemptsRef.current.delete(id)
    }

    // Stop interval if nothing left to poll
    if (pollingAttemptsRef.current.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [caseId])

  // Start polling for a document
  const startPolling = useCallback((documentId: string) => {
    // Only add if not already being polled
    if (!pollingAttemptsRef.current.has(documentId)) {
      pollingAttemptsRef.current.set(documentId, 0)
    }

    // Start interval if not already running
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(pollIndexingStatus, POLLING_INTERVAL)
    }
  }, [pollIndexingStatus])

  // Stop polling for a document
  const stopPolling = useCallback((documentId: string) => {
    pollingAttemptsRef.current.delete(documentId)

    if (pollingAttemptsRef.current.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Stop all polling
  const stopAllPolling = useCallback(() => {
    pollingAttemptsRef.current.clear()
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Fetch documents when caseId changes
  useEffect(() => {
    // Cleanup polling when caseId changes
    stopAllPolling()

    if (!caseId) {
      setDocuments([])
      setSelectedSourceIds(new Set())
      return
    }

    const fetchDocuments = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const docs = await workspaceApi.getCaseDocuments(caseId)
        setDocuments(docs)

        // Auto-select all sources by default (only USER_UPLOADED)
        const userUploadedDocs = docs.filter((d) => d.type === 'USER_UPLOADED')
        setSelectedSourceIds(new Set(userUploadedDocs.map((d) => d.id)))

        // Start polling for documents with processing status
        for (const doc of docs) {
          const isDraftOrSummary = doc.type === 'DRAFT' || doc.type === 'SUMMARY'
          const status = isDraftOrSummary ? doc.jobStatus : doc.indexingStatus
          if (status === IndexingStatus.RUNNING || status === IndexingStatus.PENDING || status === JobStatus.PROCESSING) {
            startPolling(doc.id)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch documents'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()

    // Cleanup on unmount or caseId change
    return () => {
      stopAllPolling()
    }
  }, [caseId, startPolling, stopAllPolling])

  const toggleSourceSelection = useCallback((sourceId: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(sourceId)) {
        next.delete(sourceId)
      } else {
        next.add(sourceId)
      }
      return next
    })
  }, [])

  const selectAllSources = useCallback(() => {
    const userUploadedDocs = documents.filter((d) => d.type === 'USER_UPLOADED')
    setSelectedSourceIds(new Set(userUploadedDocs.map((d) => d.id)))
  }, [documents])

  const deselectAllSources = useCallback(() => {
    setSelectedSourceIds(new Set())
  }, [])

  const uploadFile = useCallback(
    async (file: File) => {
      if (!caseId) return

      setIsUploading(true)
      setError(null)

      try {
        // Step 1: Get presigned URL (backend creates document automatically)
        const { documentId, uploadUrl } =
          await workspaceApi.getPresignedUploadUrl(caseId, file.name)

        // Step 2: Upload to S3
        await workspaceApi.uploadFileToS3(uploadUrl, file)

        // Step 3: Refresh documents to get the newly created document
        const docs = await workspaceApi.getCaseDocuments(caseId)
        setDocuments(docs)

        // Step 4: Select the newly uploaded document
        setSelectedSourceIds((prev) => new Set([...prev, documentId]))

        // Step 5: Start polling if status needs it
        const newDoc = docs.find(d => d.id === documentId)
        const isDraftOrSummary = newDoc?.type === 'DRAFT' || newDoc?.type === 'SUMMARY'
        const status = isDraftOrSummary ? newDoc?.jobStatus : newDoc?.indexingStatus
        // For USER_UPLOADED docs, also start polling if status is undefined (backend may not return initial status)
        const shouldPoll = newDoc && (
          status === IndexingStatus.RUNNING ||
          status === IndexingStatus.PENDING ||
          status === JobStatus.PROCESSING ||
          (!isDraftOrSummary && !status) // Start polling for USER_UPLOADED when status is undefined
        )
        if (shouldPoll) {
          startPolling(documentId)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload file'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [caseId, startPolling]
  )

  const deleteSource = useCallback(
    async (sourceId: string) => {
      try {
        // Stop polling before delete
        stopPolling(sourceId)

        // Delete from backend
        await workspaceApi.deleteCaseDocument(caseId!, sourceId)

        // Remove from local state
        setDocuments((prev) => prev.filter((d) => d.id !== sourceId))
        setSelectedSourceIds((prev) => {
          const next = new Set(prev)
          next.delete(sourceId)
          return next
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete source'
        setError(message)
        throw err
      }
    },
    [stopPolling]
  )

  const linkContent = useCallback(
    async (sourceId: string) => {
      try {
        const updatedDoc = await workspaceApi.triggerIndexing(caseId!, sourceId)
        // Update document in state
        setDocuments((prev) =>
          prev.map((d) => (d.id === sourceId ? updatedDoc : d))
        )

        // Start polling after re-indexing
        const isDraftOrSummary = updatedDoc.type === 'DRAFT' || updatedDoc.type === 'SUMMARY'
        const status = isDraftOrSummary ? updatedDoc.jobStatus : updatedDoc.indexingStatus
        if (status === IndexingStatus.RUNNING || status === IndexingStatus.PENDING || status === JobStatus.PROCESSING) {
          startPolling(sourceId)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to link content'
        setError(message)
        throw err
      }
    },
    [startPolling]
  )

  const renameDocument = useCallback(
    async (documentId: string, newName: string) => {
      if (!caseId) return
      try {
        await workspaceApi.updateDocument(caseId, documentId, { name: newName })
        setDocuments((prev) =>
          prev.map((d) => (d.id === documentId ? { ...d, name: newName } : d))
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to rename document'
        setError(message)
        throw err
      }
    },
    [caseId]
  )

  const batchDelete = useCallback(
    async (sourceIds: string[]) => {
      try {
        // Stop polling for all
        for (const id of sourceIds) {
          stopPolling(id)
        }

        await Promise.all(sourceIds.map((id) => workspaceApi.deleteCaseDocument(caseId!, id)))
        setDocuments((prev) => prev.filter((d) => !sourceIds.includes(d.id)))
        deselectAllSources()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete sources'
        setError(message)
        throw err
      }
    },
    [deselectAllSources, stopPolling]
  )

  const batchLinkContent = useCallback(
    async (sourceIds: string[]) => {
      try {
        await workspaceApi.batchTriggerIndexing(caseId!, sourceIds)
        // Optimistically update status to processing
        setDocuments((prev) =>
          prev.map((d) =>
            sourceIds.includes(d.id)
              ? { ...d, status: JobStatus.PROCESSING }
              : d
          )
        )

        // Start polling for all re-indexed documents
        for (const sourceId of sourceIds) {
          startPolling(sourceId)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to re-index sources'
        setError(message)
        throw err
      }
    },
    [startPolling]
  )

  const refresh = useCallback(async () => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)
    try {
      const docs = await workspaceApi.getCaseDocuments(caseId)
      setDocuments(docs)
      // Keep current selection, just refresh data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  return {
    documents,
    selectedSourceIds,
    isLoading,
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

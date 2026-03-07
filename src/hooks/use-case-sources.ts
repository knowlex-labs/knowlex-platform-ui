import { useState, useCallback, useEffect, useRef } from 'react'
import { workspaceApi } from '@/services/api/workspace-api'
import { IndexingStatus, JobStatus, type CaseSource, type CaseSourceStatus } from '@/types'

const POLLING_INTERVAL = 3000 // 3 seconds

interface UseCaseSourcesResult {
  sources: CaseSource[]
  judgments: CaseSource[]
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
  batchDelete: (sourceIds: string[]) => Promise<void>
  batchLinkContent: (sourceIds: string[]) => Promise<void>
  refresh: () => Promise<void>
}

export function useCaseSources(caseId: string | null): UseCaseSourcesResult {
  const [sources, setSources] = useState<CaseSource[]>([])
  const [judgments, setJudgments] = useState<CaseSource[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track documents being polled
  const pollingIdsRef = useRef<Set<string>>(new Set())
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll job status for documents
  const pollIndexingStatus = useCallback(async () => {
    if (!caseId) return

    const idsToRemove: string[] = []

    for (const documentId of pollingIdsRef.current) {
      try {
        const doc = await workspaceApi.getDocument(caseId, documentId)
        const status = doc.jobStatus as CaseSourceStatus

        setSources((prev) =>
          prev.map((s) =>
            s.id === documentId ? { ...s, status } : s
          )
        )

        // Stop polling if terminal status (completed/failed for either enum)
        const isCompleted = status === IndexingStatus.COMPLETED || status === JobStatus.COMPLETED
        const isFailed = status === IndexingStatus.FAILED || status === JobStatus.FAILED
        if (isCompleted || isFailed) {
          idsToRemove.push(documentId)
        }
      } catch (error) {
        // Document may have been deleted, stop polling
        console.error('Polling job status error:', error)
        idsToRemove.push(documentId)
      }
    }

    // Remove terminal documents from polling
    for (const id of idsToRemove) {
      pollingIdsRef.current.delete(id)
    }

    // Stop interval if nothing left to poll
    if (pollingIdsRef.current.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [caseId])

  // Start polling for a document
  const startPolling = useCallback((documentId: string) => {
    pollingIdsRef.current.add(documentId)

    // Start interval if not already running
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(pollIndexingStatus, POLLING_INTERVAL)
    }
  }, [pollIndexingStatus])

  // Stop polling for a document
  const stopPolling = useCallback((documentId: string) => {
    pollingIdsRef.current.delete(documentId)

    if (pollingIdsRef.current.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Stop all polling
  const stopAllPolling = useCallback(() => {
    pollingIdsRef.current.clear()
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
      setSources([])
      setSelectedSourceIds(new Set())
      return
    }

    const fetchDocuments = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const documents = await workspaceApi.getCaseDocuments(caseId)

        // Filter documents by type
        const userUploadedDocs = documents.filter((d) => d.type === 'USER_UPLOADED')
        const judgmentDocs = documents.filter((d) => d.type === 'JUDGMENT')

        setSources(userUploadedDocs)
        setJudgments(judgmentDocs)

        // Auto-select all sources by default
        setSelectedSourceIds(new Set(userUploadedDocs.map((d) => d.id)))

        // Start polling for documents with processing or pending status
        for (const doc of documents) {
          if (doc.status === IndexingStatus.RUNNING || doc.status === IndexingStatus.PENDING || doc.status === JobStatus.PROCESSING) {
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
    setSelectedSourceIds(new Set(sources.map((s) => s.id)))
  }, [sources])

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

        // Step 3: Refresh sources to get the newly created document
        const documents = await workspaceApi.getCaseDocuments(caseId)

        // Filter documents by type
        const userUploadedDocs = documents.filter((d) => d.type === 'USER_UPLOADED')
        const judgmentDocs = documents.filter((d) => d.type === 'JUDGMENT')

        setSources(userUploadedDocs)
        setJudgments(judgmentDocs)

        // Step 4: Select the newly uploaded document
        setSelectedSourceIds((prev) => new Set([...prev, documentId]))

        // Step 5: Start polling if status needs it
        const newSource = documents.find(s => s.id === documentId)
        if (newSource && (newSource.status === IndexingStatus.RUNNING || newSource.status === IndexingStatus.PENDING || newSource.status === JobStatus.PROCESSING)) {
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
        await workspaceApi.deleteCaseSource(sourceId)

        // Remove from local state
        setSources((prev) => prev.filter((s) => s.id !== sourceId))
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
        const updatedSource = await workspaceApi.triggerIndexing(caseId!, sourceId)
        // Update source in state
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? updatedSource : s))
        )

        // Start polling after re-indexing
        if (updatedSource.status === IndexingStatus.RUNNING || updatedSource.status === IndexingStatus.PENDING || updatedSource.status === JobStatus.PROCESSING) {
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

  const batchDelete = useCallback(
    async (sourceIds: string[]) => {
      try {
        // Stop polling for all
        for (const id of sourceIds) {
          stopPolling(id)
        }

        await Promise.all(sourceIds.map((id) => workspaceApi.deleteCaseSource(id)))
        setSources((prev) => prev.filter((s) => !sourceIds.includes(s.id)))
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
        setSources((prev) =>
          prev.map((s) =>
            sourceIds.includes(s.id)
              ? { ...s, status: JobStatus.PROCESSING }
              : s
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
      const documents = await workspaceApi.getCaseDocuments(caseId)

      // Filter documents by type
      const userUploadedDocs = documents.filter((d) => d.type === 'USER_UPLOADED')
      const judgmentDocs = documents.filter((d) => d.type === 'JUDGMENT')

      setSources(userUploadedDocs)
      setJudgments(judgmentDocs)
      // Keep current selection, just refresh data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  return {
    sources,
    judgments,
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
    batchDelete,
    batchLinkContent,
    refresh,
  }
}

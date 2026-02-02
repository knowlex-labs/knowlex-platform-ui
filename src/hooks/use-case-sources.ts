import { useState, useCallback, useEffect, useRef } from 'react'
import { workspaceApi } from '@/services/api/workspace-api'
import { useIndexingStatus } from './use-indexing-status'
import type { CaseSource } from '@/types'
import type { IndexingStatus } from '@/types/sse.types'

interface UseCaseSourcesResult {
  sources: CaseSource[]
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
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track previous caseId for cleanup
  const prevCaseIdRef = useRef<string | null>(null)

  // SSE status monitoring
  const { subscribe, unsubscribe, unsubscribeAll } = useIndexingStatus({
    onStatusUpdate: (documentId: string, status: IndexingStatus) => {
      setSources((prev) =>
        prev.map((s) =>
          s.id === documentId ? { ...s, indexingStatus: status } : s
        )
      )
    },
  })

  // Fetch documents when caseId changes
  useEffect(() => {
    // Cleanup SSE subscriptions when caseId changes
    if (prevCaseIdRef.current !== caseId) {
      unsubscribeAll()
      prevCaseIdRef.current = caseId
    }

    if (!caseId) {
      setSources([])
      return
    }

    const fetchDocuments = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const documents = await workspaceApi.getCaseDocuments(caseId)
        setSources(documents)

        // Start monitoring documents with INDEXING or INDEXING_PENDING status
        for (const doc of documents) {
          if (doc.indexingStatus === 'INDEXING' || doc.indexingStatus === 'INDEXING_PENDING') {
            subscribe(doc.id)
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
      unsubscribeAll()
    }
  }, [caseId, subscribe, unsubscribeAll])

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
        // Step 1: Get presigned URL
        const { uploadUrl, storageKey, storageUrl } =
          await workspaceApi.getPresignedUploadUrl(caseId, file.name)

        // Step 2: Upload to S3
        await workspaceApi.uploadFileToS3(uploadUrl, file)

        // Step 3: Register with backend
        const source = await workspaceApi.createCaseSource(
          caseId,
          file,
          storageUrl,
          storageKey
        )

        // Step 4: Add to local state and auto-select
        setSources((prev) => [...prev, source])
        setSelectedSourceIds((prev) => new Set([...prev, source.id]))

        // Step 5: Start monitoring if status needs it
        if (source.indexingStatus === 'INDEXING' || source.indexingStatus === 'INDEXING_PENDING') {
          subscribe(source.id)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload file'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [caseId, subscribe]
  )

  const deleteSource = useCallback(
    async (sourceId: string) => {
      try {
        // Stop monitoring before delete
        unsubscribe(sourceId)

        // Delete from backend (no caseId needed in path)
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
    [unsubscribe]
  )

  const linkContent = useCallback(
    async (sourceId: string) => {
      try {
        const updatedSource = await workspaceApi.linkContent(sourceId)
        // Update source in state
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? updatedSource : s))
        )

        // Start monitoring after re-indexing
        if (updatedSource.indexingStatus === 'INDEXING' || updatedSource.indexingStatus === 'INDEXING_PENDING') {
          subscribe(sourceId)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to link content'
        setError(message)
        throw err
      }
    },
    [subscribe]
  )

  const batchDelete = useCallback(
    async (sourceIds: string[]) => {
      try {
        await Promise.all(sourceIds.map((id) => workspaceApi.deleteCaseSource(id)))
        setSources((prev) => prev.filter((s) => !sourceIds.includes(s.id)))
        deselectAllSources()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete sources'
        setError(message)
        throw err
      }
    },
    [deselectAllSources]
  )

  const batchLinkContent = useCallback(
    async (sourceIds: string[]) => {
      try {
        await workspaceApi.batchLinkContent(sourceIds)
        // Optimistically update status to INDEXING
        setSources((prev) =>
          prev.map((s) =>
            sourceIds.includes(s.id)
              ? { ...s, indexingStatus: 'INDEXING' as const }
              : s
          )
        )

        // Start monitoring all re-indexed documents
        for (const sourceId of sourceIds) {
          subscribe(sourceId)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to re-index sources'
        setError(message)
        throw err
      }
    },
    [subscribe]
  )

  const refresh = useCallback(async () => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)
    try {
      const documents = await workspaceApi.getCaseDocuments(caseId)
      setSources(documents)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  return {
    sources,
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

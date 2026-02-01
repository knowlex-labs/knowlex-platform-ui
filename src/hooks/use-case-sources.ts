import { useState, useCallback } from 'react'
import { workspaceApi } from '@/services/api/workspace-api'
import type { CaseSource } from '@/types'

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
  refresh: () => void
}

export function useCaseSources(caseId: string | null): UseCaseSourcesResult {
  const [sources, setSources] = useState<CaseSource[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [isLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload file'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [caseId]
  )

  const deleteSource = useCallback(
    async (sourceId: string) => {
      try {
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
    []
  )

  const linkContent = useCallback(
    async (sourceId: string) => {
      try {
        const updatedSource = await workspaceApi.linkContent(sourceId)
        // Update source in state
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? updatedSource : s))
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to link content'
        setError(message)
        throw err
      }
    },
    []
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to re-index sources'
        setError(message)
        throw err
      }
    },
    []
  )

  const refresh = useCallback(() => {
    // No GET endpoint for listing documents - state is maintained locally after uploads
    // This is a no-op but kept for interface compatibility
  }, [])

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

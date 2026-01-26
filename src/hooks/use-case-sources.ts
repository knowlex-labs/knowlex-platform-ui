import { useState, useEffect, useCallback } from 'react'
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
  refresh: () => Promise<void>
}

export function useCaseSources(caseId: string | null): UseCaseSourcesResult {
  const [sources, setSources] = useState<CaseSource[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = useCallback(async () => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await workspaceApi.getCaseSources(caseId)
      setSources(data)
      // Auto-select all sources by default
      setSelectedSourceIds(new Set(data.map((s) => s.id)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sources'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

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
        // Get pre-signed URL
        const { uploadUrl, s3Key } = await workspaceApi.getPresignedUploadUrl(
          caseId,
          file.name,
          file.type
        )

        // Upload to S3
        await workspaceApi.uploadFileToS3(uploadUrl, file)

        // Register with backend
        const source = await workspaceApi.createCaseSource(caseId, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          s3Url: `https://mock-s3-bucket.s3.amazonaws.com/${s3Key}`,
        })

        // Add to local state and auto-select
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
      if (!caseId) return

      try {
        await workspaceApi.deleteCaseSource(caseId, sourceId)
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
    [caseId]
  )

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
    refresh: fetchSources,
  }
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { workspaceApi } from '@/services/api/workspace-api'
import type { CaseSynopsis } from '@/types'

const POLL_INTERVAL_MS = 6000
const MAX_POLL_ATTEMPTS = 60

export function useSynopsis(caseId: string) {
  const [synopsis, setSynopsis] = useState<CaseSynopsis | null>(null)
  const [isLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollAttemptsRef = useRef(0)
  const documentIdRef = useRef<string | null>(null)

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    pollAttemptsRef.current = 0
  }, [])

  type RawDoc = {
    id: string
    status?: string
    jobStatus?: string
    draft_body?: string
    content?: string
    signedUrl?: string
    downloadUrl?: string
    created_at?: string
    updated_at?: string
    createdAt?: string
    updatedAt?: string
  }

  const mapDoc = (raw: RawDoc, fetchedContent?: string): CaseSynopsis => {
    const rawStatus = (raw.status ?? raw.jobStatus ?? 'pending').toLowerCase()
    const status = rawStatus === 'processing' ? 'pending' : (rawStatus as CaseSynopsis['status'])
    return {
      id: raw.id,
      status,
      content: fetchedContent ?? raw.draft_body ?? raw.content ?? '',
      createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
      updatedAt: new Date(raw.updated_at ?? raw.updatedAt ?? Date.now()),
    }
  }

  const fetchSynopsis = useCallback(async (): Promise<CaseSynopsis | null> => {
    try {
      let raw: RawDoc | null = null

      if (documentIdRef.current) {
        raw = (await workspaceApi.getDocument(caseId, documentIdRef.current)) as RawDoc
      } else {
        const docs = await workspaceApi.getCaseDocuments(caseId, 'SYNOPSIS')
        if (docs && docs.length > 0) {
          raw = docs[0] as RawDoc
          documentIdRef.current = raw.id
        }
      }

      if (!raw) return null

      const rawStatus = (raw.status ?? raw.jobStatus ?? '').toLowerCase()
      const isCompleted = rawStatus === 'completed'

      let fetchedContent: string | undefined
      if (isCompleted && (raw.downloadUrl ?? raw.signedUrl)) {
        try {
          fetchedContent = await workspaceApi.fetchDocumentContent({
            id: raw.id,
            downloadUrl: raw.downloadUrl,
            signedUrl: raw.signedUrl,
          })
        } catch {
          // fall back to empty string
        }
      }

      const mapped = mapDoc(raw, fetchedContent)
      setSynopsis(mapped)
      return mapped
    } catch {
      // 404 or no synopsis yet
    }
    return null
  }, [caseId])

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return
    pollAttemptsRef.current = 0

    pollingIntervalRef.current = setInterval(async () => {
      pollAttemptsRef.current++

      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling()
        setIsGenerating(false)
        setSynopsis((prev) => (prev ? { ...prev, status: 'failed' } : null))
        return
      }

      const current = await fetchSynopsis()
      if (current && (current.status === 'completed' || current.status === 'failed')) {
        stopPolling()
        setIsGenerating(false)
      }
    }, POLL_INTERVAL_MS)
  }, [fetchSynopsis, stopPolling])

  // Fetch existing synopsis on mount
  useEffect(() => {
    fetchSynopsis()
  }, [fetchSynopsis])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const generateSynopsis = useCallback(async () => {
    setError(null)
    setIsGenerating(true)
    setSynopsis((prev) =>
      prev
        ? { ...prev, status: 'pending', content: '' }
        : {
            id: 'pending',
            status: 'pending',
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
    )
    try {
      const doc = await workspaceApi.createDocument(caseId, {
        document_type: 'SYNOPSIS',
      } as Parameters<typeof workspaceApi.createDocument>[1])
      if (doc?.id) {
        documentIdRef.current = doc.id
      }
      startPolling()
    } catch {
      setIsGenerating(false)
      setError('Failed to generate synopsis. Please try again.')
      setSynopsis(null)
    }
  }, [caseId, startPolling])

  const deleteSynopsis = useCallback(async () => {
    try {
      const id = documentIdRef.current ?? synopsis?.id
      if (!id || id === 'pending') return
      await workspaceApi.deleteDocuments([id])
      documentIdRef.current = null
      setSynopsis(null)
    } catch {
      setError('Failed to delete synopsis.')
    }
  }, [caseId, synopsis?.id])

  return {
    synopsis,
    isLoading,
    isGenerating,
    error,
    fetchSynopsis,
    generateSynopsis,
    deleteSynopsis,
  }
}
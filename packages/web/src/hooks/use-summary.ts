import { useState, useEffect, useRef, useCallback } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { CaseSummary } from '@knowlex/core/types'

const POLL_INTERVAL_MS = 6000
const MAX_POLL_ATTEMPTS = 60

export function useSummary(caseId: string) {
  const [summary, setSummary] = useState<CaseSummary | null>(null)
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

  type RawDoc = { id: string; status?: string; jobStatus?: string; draft_body?: string; content?: string; signedUrl?: string; downloadUrl?: string; created_at?: string; updated_at?: string; createdAt?: string; updatedAt?: string }

  const mapDoc = (raw: RawDoc, fetchedContent?: string): CaseSummary => {
    const rawStatus = (raw.status ?? raw.jobStatus ?? 'pending').toLowerCase()
    const status = rawStatus === 'processing' ? 'pending' : (rawStatus as CaseSummary['status'])
    return {
      id: raw.id,
      status,
      content: fetchedContent ?? raw.draft_body ?? raw.content ?? '',
      createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
      updatedAt: new Date(raw.updated_at ?? raw.updatedAt ?? Date.now()),
    }
  }

  const fetchSummary = useCallback(async (): Promise<CaseSummary | null> => {
    try {
      let raw: RawDoc | null = null

      if (documentIdRef.current) {
        raw = await workspaceApi.getDocument(caseId, documentIdRef.current) as RawDoc
      } else {
        const docs = await workspaceApi.getCaseDocuments(caseId, 'SUMMARY')
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
      setSummary(mapped)
      return mapped
    } catch {
      // 404 or no summary yet
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
        setSummary((prev) => prev ? { ...prev, status: 'failed' } : null)
        return
      }

      const current = await fetchSummary()
      if (current && (current.status === 'completed' || current.status === 'failed')) {
        stopPolling()
        setIsGenerating(false)
      }
    }, POLL_INTERVAL_MS)
  }, [fetchSummary, stopPolling])

  // Fetch existing summary on mount
  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const generateSummary = useCallback(async () => {
    setError(null)
    setIsGenerating(true)
    setSummary((prev) =>
      prev
        ? { ...prev, status: 'pending', content: '' }
        : { id: 'pending', status: 'pending', content: '', createdAt: new Date(), updatedAt: new Date() }
    )
    try {
      const doc = await workspaceApi.createDocument(caseId, {
        document_type: 'SUMMARY',
      } as Parameters<typeof workspaceApi.createDocument>[1])
      if (doc?.id) {
        documentIdRef.current = doc.id
      }
      startPolling()
    } catch {
      setIsGenerating(false)
      setError('Failed to generate summary. Please try again.')
      setSummary(null)
    }
  }, [caseId, startPolling])

  const deleteSummary = useCallback(async () => {
    try {
      const id = documentIdRef.current ?? summary?.id
      if (!id || id === 'pending') return
      await workspaceApi.deleteDocuments([id])
      documentIdRef.current = null
      setSummary(null)
    } catch {
      setError('Failed to delete summary.')
    }
  }, [caseId, summary?.id])

  return {
    summary,
    isLoading,
    isGenerating,
    error,
    fetchSummary,
    generateSummary,
    deleteSummary,
  }
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { CaseSummary } from '@knowlex/core/types'

export function useSummary(caseId: string) {
  const [summary, setSummary] = useState<CaseSummary | null>(null)
  const [isLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamCtrlRef = useRef<AbortController | null>(null)
  const documentIdRef = useRef<string | null>(null)

  const stopStream = useCallback(() => {
    streamCtrlRef.current?.abort()
    streamCtrlRef.current = null
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

  const resolveTerminal = useCallback(async (documentId: string, jobStatus: string, downloadUrl?: string | null, signedUrl?: string | null) => {
    const s = jobStatus.toLowerCase()
    if (s === 'completed') {
      let fetchedContent = ''
      try {
        fetchedContent = await workspaceApi.fetchDocumentContent({ id: documentId, downloadUrl: downloadUrl ?? undefined, signedUrl: signedUrl ?? undefined })
      } catch { /* leave empty */ }
      setSummary(prev => ({ id: documentId, status: 'completed', content: fetchedContent, createdAt: prev?.createdAt ?? new Date(), updatedAt: new Date() }))
      setIsGenerating(false)
    } else if (s === 'failed') {
      setSummary(prev => prev ? { ...prev, status: 'failed' } : null)
      setIsGenerating(false)
    }
  }, [])

  const startStream = useCallback((documentId: string) => {
    stopStream()
    let receivedTerminal = false
    streamCtrlRef.current = workspaceApi.streamDocumentStatus(documentId, {
      onStatus: async (doc) => {
        const s = (doc.jobStatus ?? '').toLowerCase()
        if (s === 'completed' || s === 'failed') {
          receivedTerminal = true
          await resolveTerminal(documentId, doc.jobStatus, doc.downloadUrl, doc.signedUrl)
          stopStream()
        }
      },
      onError: () => { stopStream(); setIsGenerating(false) },
      onEnd: async () => {
        stopStream()
        if (!receivedTerminal) {
          try {
            const raw = await workspaceApi.getDocument('', documentId) as RawDoc
            const s = (raw.status ?? raw.jobStatus ?? '').toLowerCase()
            if (s === 'completed' || s === 'failed') {
              await resolveTerminal(documentId, s, raw.downloadUrl, raw.signedUrl)
            }
          } catch { /* ignore */ }
        }
      },
    })
  }, [stopStream, resolveTerminal])

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
      const isProcessing = rawStatus === 'processing' || rawStatus === 'pending'

      let fetchedContent: string | undefined
      if (isCompleted && (raw.downloadUrl ?? raw.signedUrl)) {
        try {
          fetchedContent = await workspaceApi.fetchDocumentContent({
            id: raw.id,
            downloadUrl: raw.downloadUrl,
            signedUrl: raw.signedUrl,
          })
        } catch { /* fall back to empty string */ }
      }

      const mapped = mapDoc(raw, fetchedContent)
      setSummary(mapped)

      // Resume streaming if doc is still processing (e.g., after page reload)
      if (isProcessing && !streamCtrlRef.current) {
        startStream(raw.id)
      }

      return mapped
    } catch { /* 404 or no summary yet */ }
    return null
  }, [caseId, startStream])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // Stop stream when caseId changes or on unmount
  useEffect(() => {
    return () => stopStream()
  }, [caseId, stopStream])

  const generateSummary = useCallback(async (webSearch?: boolean) => {
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
        ...(webSearch ? { web_search: true } : {}),
      } as Parameters<typeof workspaceApi.createDocument>[1])
      if (doc?.id) {
        documentIdRef.current = doc.id
        startStream(doc.id)
      }
    } catch {
      setIsGenerating(false)
      setError('Failed to generate summary. Please try again.')
      setSummary(null)
    }
  }, [caseId, startStream])

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

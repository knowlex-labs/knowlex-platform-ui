import { useState, useEffect, useRef, useCallback } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { CasePrecedent } from '@knowlex/core/types'

function pickDocumentJobStatus(doc: { jobStatus?: string; status?: string } | null | undefined): string {
  const v = doc?.jobStatus ?? doc?.status
  return v == null ? '' : String(v)
}

export function usePrecedent(caseId: string) {
  const [precedent, setPrecedent] = useState<CasePrecedent | null>(null)
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

  const mapDoc = (raw: RawDoc, fetchedContent?: string): CasePrecedent => {
    const rawStatus = (raw.status ?? raw.jobStatus ?? 'pending').toLowerCase()
    const status = rawStatus === 'processing' ? 'pending' : (rawStatus as CasePrecedent['status'])
    return {
      id: raw.id,
      status,
      content: fetchedContent ?? raw.draft_body ?? raw.content ?? '',
      createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
      updatedAt: new Date(raw.updated_at ?? raw.updatedAt ?? Date.now()),
    }
  }

  const resolveTerminal = useCallback(async (documentId: string, jobStatus: string, downloadUrl?: string | null, signedUrl?: string | null) => {
    const rawStatus = (jobStatus ?? '').toString().toLowerCase()
    if (!rawStatus) return
    if (rawStatus === 'completed') {
      let fetchedContent = ''
      try {
        fetchedContent = await workspaceApi.fetchDocumentContent({ id: documentId, downloadUrl: downloadUrl ?? undefined, signedUrl: signedUrl ?? undefined })
      } catch { /* leave empty */ }
      setPrecedent(prev => ({ id: documentId, status: 'completed', content: fetchedContent, createdAt: prev?.createdAt ?? new Date(), updatedAt: new Date() }))
      setIsGenerating(false)
    } else if (rawStatus === 'failed') {
      setPrecedent(prev => prev ? { ...prev, status: 'failed' } : null)
      setIsGenerating(false)
    }
  }, [])

  const startStream = useCallback((documentId: string) => {
    stopStream()
    let receivedTerminal = false
    streamCtrlRef.current = workspaceApi.pollDocumentStatus(documentId, {
      onStatus: async (doc) => {
        const st = pickDocumentJobStatus(doc).toLowerCase()
        if (st === 'completed' || st === 'failed') {
          receivedTerminal = true
          await resolveTerminal(documentId, pickDocumentJobStatus(doc), doc.downloadUrl, doc.signedUrl)
          stopStream()
        }
      },
      onError: () => { stopStream(); setIsGenerating(false) },
      onEnd: async () => {
        stopStream()
        if (!receivedTerminal) {
          // Stream ended before a terminal event — fetch final state once
          try {
            const raw = await workspaceApi.getDocument('', documentId) as RawDoc
            const st = pickDocumentJobStatus(raw).toLowerCase()
            if (st === 'completed' || st === 'failed') {
              await resolveTerminal(documentId, pickDocumentJobStatus(raw), raw.downloadUrl, raw.signedUrl)
            }
          } catch { /* ignore */ }
        }
      },
    })
  }, [stopStream, resolveTerminal])

  const fetchPrecedent = useCallback(async (): Promise<CasePrecedent | null> => {
    try {
      let raw: RawDoc | null = null

      if (documentIdRef.current) {
        raw = await workspaceApi.getDocument(caseId, documentIdRef.current) as RawDoc
      } else {
        const docs = await workspaceApi.getCaseDocuments(caseId, 'PRECEDENT')
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
      setPrecedent(mapped)

      if (isProcessing && !streamCtrlRef.current) {
        startStream(raw.id)
      }

      return mapped
    } catch { /* 404 or no precedent yet */ }
    return null
  }, [caseId, startStream])

  useEffect(() => {
    fetchPrecedent()
  }, [fetchPrecedent])

  useEffect(() => {
    return () => stopStream()
  }, [caseId, stopStream])

  const generatePrecedent = useCallback(async () => {
    setError(null)
    setIsGenerating(true)
    setPrecedent((prev) =>
      prev
        ? { ...prev, status: 'pending', content: '' }
        : { id: 'pending', status: 'pending', content: '', createdAt: new Date(), updatedAt: new Date() }
    )
    try {
      const doc = await workspaceApi.createDocument(caseId, {
        document_type: 'PRECEDENT',
        case_id: caseId,
      } as Parameters<typeof workspaceApi.createDocument>[1])
      if (doc?.id) {
        documentIdRef.current = doc.id
        startStream(doc.id)
      }
    } catch {
      setIsGenerating(false)
      setError('Failed to generate precedent analysis. Please try again.')
      setPrecedent(null)
    }
  }, [caseId, startStream])

  const deletePrecedent = useCallback(async () => {
    try {
      const id = documentIdRef.current ?? precedent?.id
      if (!id || id === 'pending') return
      await workspaceApi.deleteDocuments([id])
      documentIdRef.current = null
      setPrecedent(null)
    } catch {
      setError('Failed to delete precedent analysis.')
    }
  }, [caseId, precedent?.id])

  return {
    precedent,
    isLoading,
    isGenerating,
    error,
    fetchPrecedent,
    generatePrecedent,
    deletePrecedent,
  }
}

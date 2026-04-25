import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { CaseSummary } from '@knowlex/core/types'

/** Document status from API (SSE / GET) — prefer `jobStatus`, fall back to `status`. */
function pickDocumentJobStatus(doc: { jobStatus?: string; status?: string } | null | undefined): string {
  const v = doc?.jobStatus ?? doc?.status
  return v == null ? '' : String(v)
}

type RawDoc = {
  id: string
  name?: string
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

export function useSummary(caseId: string) {
  const [summaries, setSummaries] = useState<CaseSummary[]>([])
  const [isLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamCtrlRef = useRef<AbortController | null>(null)
  /** Document id currently receiving SSE (latest generation job) */
  const streamingIdRef = useRef<string | null>(null)

  const stopStream = useCallback(() => {
    streamCtrlRef.current?.abort()
    streamCtrlRef.current = null
    streamingIdRef.current = null
  }, [])

  const mapDoc = (raw: RawDoc, fetchedContent?: string): CaseSummary => {
    const rawStatus = (raw.status ?? raw.jobStatus ?? 'pending').toLowerCase()
    const status = rawStatus === 'processing' ? 'pending' : (rawStatus as CaseSummary['status'])
    return {
      id: raw.id,
      status,
      title: raw.name,
      content: fetchedContent ?? raw.draft_body ?? raw.content ?? '',
      createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
      updatedAt: new Date(raw.updated_at ?? raw.updatedAt ?? Date.now()),
    }
  }

  const resolveTerminal = useCallback(async (documentId: string, jobStatus: string, downloadUrl?: string | null, signedUrl?: string | null) => {
    const s = (jobStatus ?? '').toString().toLowerCase()
    if (!s) return
    if (s === 'completed') {
      let fetchedContent = ''
      try {
        fetchedContent = await workspaceApi.fetchDocumentContent({ id: documentId, downloadUrl: downloadUrl ?? undefined, signedUrl: signedUrl ?? undefined })
      } catch { /* leave empty */ }
      setSummaries((prev) => prev.map((row) =>
        row.id === documentId
          ? { ...row, status: 'completed', content: fetchedContent, updatedAt: new Date() }
          : row
      ))
      setIsGenerating(false)
    } else if (s === 'failed') {
      setSummaries((prev) => prev.map((row) =>
        row.id === documentId ? { ...row, status: 'failed' as const } : row
      ))
      setIsGenerating(false)
    }
  }, [])

  const startStream = useCallback((documentId: string) => {
    stopStream()
    streamingIdRef.current = documentId
    let receivedTerminal = false
    streamCtrlRef.current = workspaceApi.streamDocumentStatus(documentId, {
      onStatus: async (doc) => {
        const st = pickDocumentJobStatus(doc).toLowerCase()
        if (st === 'completed' || st === 'failed') {
          receivedTerminal = true
          await resolveTerminal(documentId, pickDocumentJobStatus(doc), doc.downloadUrl, doc.signedUrl)
          stopStream()
        }
      },
      onError: async () => {
        stopStream()
        if (receivedTerminal) return
        try {
          const raw = await workspaceApi.getDocument('', documentId) as RawDoc
          const st = pickDocumentJobStatus(raw).toLowerCase()
          if (st === 'completed' || st === 'failed') {
            await resolveTerminal(documentId, pickDocumentJobStatus(raw), raw.downloadUrl, raw.signedUrl)
            return
          }
        } catch { /* ignore */ }
        setIsGenerating(false)
      },
      onEnd: async () => {
        stopStream()
        if (receivedTerminal) return
        try {
          const raw = await workspaceApi.getDocument('', documentId) as RawDoc
          const st = pickDocumentJobStatus(raw).toLowerCase()
          if (st === 'completed' || st === 'failed') {
            await resolveTerminal(documentId, pickDocumentJobStatus(raw), raw.downloadUrl, raw.signedUrl)
            return
          }
        } catch { /* ignore */ }
        // Stream closed but job state still non-terminal in GET
        setIsGenerating(false)
      },
    })
  }, [stopStream, resolveTerminal])

  const fetchSummary = useCallback(async (): Promise<CaseSummary[] | null> => {
    try {
      const docs = await workspaceApi.getCaseDocuments(caseId, 'SUMMARY')
      if (!docs?.length) {
        setSummaries([])
        return []
      }
      const sorted = [...docs].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )

      const mapped: CaseSummary[] = []
      for (const doc of sorted) {
        const raw = doc as unknown as RawDoc
        const rawStatus = (raw.status ?? raw.jobStatus ?? '').toLowerCase()
        const isProcessing = rawStatus === 'processing' || rawStatus === 'pending'
        // Keep list fetch fast: do not download file content here.
        // Content is fetched lazily when the user opens preview.
        mapped.push(mapDoc(raw))

        if (isProcessing && !streamCtrlRef.current) {
          startStream(raw.id)
        }
      }

      setSummaries(mapped)
      return mapped
    } catch { /* no rows */ }
    setSummaries([])
    return null
  }, [caseId, startStream])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    return () => stopStream()
  }, [caseId, stopStream])

  const generateSummary = useCallback(
    async (fileIds: string[], webSearch?: boolean) => {
      setError(null)

      let titleForJob = 'Case Summary'
      let skip = false
      setSummaries((prev) => {
        if (prev.some((s) => s.status === 'pending')) {
          skip = true
          return prev
        }
        const existingCount = prev.filter((s) => s.id !== 'pending').length
        titleForJob = existingCount === 0 ? 'Case Summary' : `Case Summary (v${existingCount + 1})`
        return [
          {
            id: 'pending',
            status: 'pending',
            title: titleForJob,
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...prev.filter((s) => s.id !== 'pending'),
        ]
      })

      if (skip) return

      setIsGenerating(true)

      try {
        if (!fileIds || fileIds.length === 0) {
          throw new Error('No documents selected for summary')
        }

        const doc = await workspaceApi.createDocument(caseId, {
          document_type: 'SUMMARY',
          case_id: caseId,
          data: {
            file_ids: fileIds,
            title: titleForJob,
          },
          ...(webSearch ? { web_search: true } : {}),
        } as Parameters<typeof workspaceApi.createDocument>[1])

        if (doc?.id) {
          const resolvedTitle = titleForJob
          setSummaries((prev) =>
            prev.map((s) =>
              s.id === 'pending'
                ? {
                    id: doc.id,
                    status: 'pending',
                    title: doc.name ?? resolvedTitle,
                    content: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }
                : s
            )
          )
          startStream(doc.id)
        }
      } catch (err) {
        console.error(err)
        setIsGenerating(false)
        setError('Failed to generate summary. Please try again.')
        setSummaries((prev) => prev.filter((s) => s.id !== 'pending'))
      }
    },
    [caseId, startStream]
  )

  const deleteSummary = useCallback(async (documentId?: string) => {
    try {
      const id = documentId ?? summaries.find((s) => s.id !== 'pending')?.id
      if (!id || id === 'pending') return
      await workspaceApi.deleteDocuments([id])
      setSummaries((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setError('Failed to delete summary.')
    }
  }, [summaries])

  const summary = useMemo(() => (summaries.length > 0 ? summaries[0] : null), [summaries])

  return {
    summaries,
    summary,
    isLoading,
    isGenerating,
    error,
    fetchSummary,
    generateSummary,
    deleteSummary,
  }
}

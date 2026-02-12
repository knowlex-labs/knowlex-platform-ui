import { useState, useCallback, useEffect, useRef } from 'react'
import { draftsApi, type DraftListItem, type CreateDraftRequest } from '@/services/api/drafts-api'
import { config } from '@/config/env'
import type { Draft } from '@/types'

export type { DocumentType } from '@/services/api/drafts-api'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 60

// Normalize API status: backend returns "processing" | "completed" | "failed"
function normalizeStatus(status: string): 'pending' | 'completed' | 'failed' {
  const s = status.toLowerCase()
  if (s === 'completed') return 'completed'
  if (s === 'failed') return 'failed'
  return 'pending'
}

// Maps a flat CaseDraftResponse (used by list, single GET, and create endpoints) to Draft
function mapListItemToDraft(item: DraftListItem): Draft {
  return {
    id: item.id,
    title: item.title || item.metadata?.title || 'Untitled',
    content: item.draft_body || '',
    status: normalizeStatus(item.status),
    sections: item.sections || [],
    summary: item.metadata?.summary || '',
    templateType: item.document_type || item.metadata?.document_type,
    createdAt: new Date(item.created_at),
    updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(item.created_at),
  }
}

interface UseDraftsResult {
  drafts: Draft[]
  isLoading: boolean
  error: string | null
  createDraft: (request: CreateDraftRequest) => Draft
  updateDraftLocal: (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => void
  saveDraftToBackend: (id: string, title?: string, content?: string) => Promise<void>
  deleteDraft: (id: string) => Promise<void>
  getDraft: (id: string) => Draft | undefined
  refresh: () => Promise<void>
}

export function useDrafts(caseId: string): UseDraftsResult {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Polling: jobId → { attempts, draftId }
  // The GET endpoint uses job_id in the URL, but we track which draft.id it belongs to
  const pollingJobsRef = useRef<Map<string, { attempts: number; draftId: string }>>(new Map())
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const caseIdRef = useRef(caseId)
  caseIdRef.current = caseId

  // Dirty tracking for batch backend save
  const dirtyDraftIdsRef = useRef<Set<string>>(new Set())
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts

  // Poll pending drafts
  const pollPendingDrafts = useCallback(async () => {
    const jobs = pollingJobsRef.current
    if (jobs.size === 0) return

    const toRemove: string[] = []

    for (const [jobId, info] of jobs.entries()) {
      if (info.attempts >= MAX_POLL_ATTEMPTS) {
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === info.draftId ? { ...d, status: 'failed' as const } : d
          )
        )
        toRemove.push(jobId)
        continue
      }

      try {
        const jobResponse = await draftsApi.get(caseIdRef.current, jobId)
        const item = jobResponse.data
        const status = normalizeStatus(item.status)

        if (status === 'completed') {
          const draft = mapListItemToDraft(item)
          setDrafts((prev) =>
            prev.map((d) => (d.id === info.draftId ? draft : d))
          )
          toRemove.push(jobId)
        } else if (status === 'failed') {
          setDrafts((prev) =>
            prev.map((d) =>
              d.id === info.draftId ? { ...d, status: 'failed' as const } : d
            )
          )
          toRemove.push(jobId)
        } else {
          jobs.set(jobId, { ...info, attempts: info.attempts + 1 })
        }
      } catch {
        jobs.set(jobId, { ...info, attempts: info.attempts + 1 })
      }
    }

    for (const id of toRemove) {
      jobs.delete(id)
    }

    if (jobs.size === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  const ensurePolling = useCallback(() => {
    if (!pollingIntervalRef.current && pollingJobsRef.current.size > 0) {
      pollingIntervalRef.current = setInterval(pollPendingDrafts, POLL_INTERVAL_MS)
    }
  }, [pollPendingDrafts])

  // Cleanup polling on unmount or caseId change
  useEffect(() => {
    return () => {
      pollingJobsRef.current.clear()
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [caseId])

  // Batch save dirty drafts to backend every 2 minutes
  useEffect(() => {
    const batchSaveInterval = setInterval(() => {
      const dirtyIds = dirtyDraftIdsRef.current
      if (dirtyIds.size === 0) return

      for (const id of dirtyIds) {
        const draft = draftsRef.current.find((d) => d.id === id)
        if (draft && draft.status === 'completed') {
          draftsApi.update(caseIdRef.current, id, {
            title: draft.title,
            draft_body: draft.content,
          }).then(() => {
            dirtyIds.delete(id)
          }).catch((err) => {
            console.error('Batch save failed for draft:', id, err)
          })
        }
      }
    }, 2 * 60 * 1000)

    const handleBeforeUnload = () => {
      const dirtyIds = dirtyDraftIdsRef.current
      for (const id of dirtyIds) {
        const draft = draftsRef.current.find((d) => d.id === id)
        if (draft && draft.status === 'completed') {
          const url = `${config.apiBaseUrl}/api/v1/cases/${caseIdRef.current}/drafts/${id}`
          const body = JSON.stringify({ title: draft.title, draft_body: draft.content })
          navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
        }
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(batchSaveInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [caseId])

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await draftsApi.list(caseId)
      const items = response.data || []
      setDrafts(items.map(mapListItemToDraft))

      // Resume polling for any in-progress drafts (use job_id for GET, draft.id for matching)
      for (const item of items) {
        if (item.status !== 'completed' && item.status !== 'failed') {
          pollingJobsRef.current.set(item.job_id, { attempts: 0, draftId: item.id })
        }
      }
      ensurePolling()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch drafts'
      setError(message)
      console.error('Failed to fetch drafts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId, ensurePolling])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  // Create draft: POST → insert placeholder → poll → content fills in
  const createDraft = useCallback((request: CreateDraftRequest): Draft => {
    const placeholderId = `pending-${Date.now()}`

    const placeholder: Draft = {
      id: placeholderId,
      title: request.title || 'Generating...',
      content: '',
      status: 'pending',
      sections: [],
      summary: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setDrafts((prev) => [placeholder, ...prev])

    draftsApi.create(caseId, request).then((createResponse) => {
      const data = createResponse.data
      // Use database id as the draft identifier; fall back to job_id for older API shapes
      const draftId = data.id || data.job_id

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === placeholderId ? { ...d, id: draftId } : d
        )
      )

      // Poll using the database id (backend GET endpoint expects id in URL)
      pollingJobsRef.current.set(draftId, { attempts: 0, draftId })
      ensurePolling()
    }).catch(() => {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === placeholderId ? { ...d, status: 'failed' as const } : d
        )
      )
    })

    return placeholder
  }, [caseId, ensurePolling])

  // Update draft in local state only (no backend call)
  const updateDraftLocal = useCallback((id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id
          ? { ...draft, ...updates, updatedAt: new Date(), ...(updates.content !== undefined ? { sections: [] } : {}) }
          : draft
      )
    )
    dirtyDraftIdsRef.current.add(id)
  }, [])

  // Persist a single draft to backend
  // When title/content are provided, use them directly (avoids stale ref race condition).
  // When omitted (e.g. batch save), fall back to draftsRef.
  const saveDraftToBackend = useCallback(async (id: string, title?: string, content?: string) => {
    const resolvedTitle = title ?? draftsRef.current.find((d) => d.id === id)?.title
    const resolvedContent = content ?? draftsRef.current.find((d) => d.id === id)?.content
    if (resolvedTitle === undefined || resolvedContent === undefined) return

    try {
      await draftsApi.update(caseId, id, {
        title: resolvedTitle,
        draft_body: resolvedContent,
      })
      dirtyDraftIdsRef.current.delete(id)
    } catch (error) {
      console.error('Failed to save draft to backend:', error)
      setError('Failed to save draft. Will retry automatically.')
    }
  }, [caseId])

  const deleteDraft = useCallback(async (id: string) => {
    // Stop polling if this draft was being polled
    for (const [jobId, info] of pollingJobsRef.current.entries()) {
      if (info.draftId === id) {
        pollingJobsRef.current.delete(jobId)
        break
      }
    }

    try {
      await draftsApi.cancel(caseId, id)
    } catch {
      // job may already be completed — safe to ignore
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }, [caseId])

  const getDraft = useCallback(
    (id: string): Draft | undefined => drafts.find((draft) => draft.id === id),
    [drafts]
  )

  return {
    drafts,
    isLoading,
    error,
    createDraft,
    updateDraftLocal,
    saveDraftToBackend,
    deleteDraft,
    getDraft,
    refresh: fetchDrafts,
  }
}

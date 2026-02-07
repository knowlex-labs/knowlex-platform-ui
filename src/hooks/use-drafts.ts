import { useState, useCallback, useEffect } from 'react'
import { draftsApi, type DraftJobResponse, type DraftListItem, type CreateDraftRequest } from '@/services/api/drafts-api'
import type { Draft } from '@/types'

export type { DocumentType } from '@/services/api/drafts-api'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 60

// Maps the legacy job response format (used when polling a single job)
function mapJobToDraft(job: DraftJobResponse): Draft {
  return {
    id: job.job_id,
    title: job.result?.metadata.title || 'Untitled',
    content: job.result?.draft || '',
    status: job.status,
    sections: job.result?.sections || [],
    summary: job.result?.metadata.summary || '',
    createdAt: new Date(job.created_at),
    updatedAt: job.completed_at ? new Date(job.completed_at) : new Date(job.created_at),
  }
}

// Maps the list endpoint response format (draft_body, metadata at top level)
function mapListItemToDraft(item: DraftListItem): Draft {
  return {
    id: item.job_id,
    title: item.title || item.metadata?.title || 'Untitled',
    content: item.draft_body || '',
    status: item.status,
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
  createDraft: (request: CreateDraftRequest) => Promise<Draft>
  updateDraft: (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => void
  deleteDraft: (id: string) => Promise<void>
  getDraft: (id: string) => Draft | undefined
  refresh: () => Promise<void>
}

export function useDrafts(caseId: string): UseDraftsResult {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await draftsApi.list(caseId)
      // response.data is now an array of DraftListItem directly
      const items = response.data || []
      const completedItems = items.filter((item) => item.status === 'completed')
      setDrafts(completedItems.map(mapListItemToDraft))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch drafts'
      setError(message)
      console.error('Failed to fetch drafts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  // POST to create the job, then poll GET until completed or failed
  const createDraft = useCallback(async (request: CreateDraftRequest): Promise<Draft> => {
    const createResponse = await draftsApi.create(caseId, request)
    const jobId = createResponse.data.job_id

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const jobResponse = await draftsApi.get(caseId, jobId)
      const job = jobResponse.data

      if (job.status === 'completed') {
        const draft = mapJobToDraft(job)
        setDrafts((prev) => [draft, ...prev])
        return draft
      }

      if (job.status === 'failed') {
        throw new Error(job.error || 'Draft generation failed')
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    throw new Error('Draft generation timed out')
  }, [caseId])

  // Update draft - calls backend API to persist, falls back to local-only if API unavailable
  const updateDraft = useCallback(async (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => {
    // Optimistically update local state first
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id ? { ...draft, ...updates, updatedAt: new Date() } : draft
      )
    )

    // Try to persist to backend
    try {
      await draftsApi.update(caseId, id, {
        title: updates.title,
        draft_body: updates.content,
      })
    } catch (error) {
      console.warn('Failed to save draft to backend, changes are local only:', error)
      // Keep the local update even if API fails
    }
  }, [caseId])

  // DELETE only works on pending jobs; ignore errors for already-completed jobs
  const deleteDraft = useCallback(async (id: string) => {
    try {
      await draftsApi.cancel(caseId, id)
    } catch {
      // job may already be completed — safe to ignore
    }
    setDrafts((prev) => prev.filter((draft) => draft.id !== id))
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
    updateDraft,
    deleteDraft,
    getDraft,
    refresh: fetchDrafts,
  }
}

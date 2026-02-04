import { useState, useCallback, useEffect } from 'react'
import { draftsApi, type BackendDraft } from '@/services/api/drafts-api'
import type { Draft } from '@/types'

// Map backend draft to frontend draft
function mapBackendToFrontend(backend: BackendDraft): Draft {
  return {
    id: backend.id,
    title: backend.title,
    content: backend.body,
    caseId: backend.case_id || '',
    createdAt: new Date(backend.created_at),
    updatedAt: new Date(backend.updated_at),
  }
}

// Valid document types accepted by the API
export type DocumentType = 'contract' | 'agreement' | 'legal_notice' | 'demand_notice' | 'petition' | 'affidavit' | 'application'

interface UseDraftsResult {
  drafts: Draft[]
  isLoading: boolean
  error: string | null
  addDraft: (title: string, content: string, documentType?: DocumentType) => Promise<Draft>
  updateDraft: (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => Promise<void>
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
      const mappedDrafts = response.drafts.map(mapBackendToFrontend)
      setDrafts(mappedDrafts)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch drafts'
      setError(message)
      console.error('Failed to fetch drafts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  // Fetch drafts on mount and when caseId changes
  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  const addDraft = useCallback(
    async (title: string, content: string, documentType: DocumentType = 'legal_notice'): Promise<Draft> => {
      const response = await draftsApi.create({
        title,
        body: content,
        document_type: documentType,
        file_ids: [],
        metadata: {},
        case_id: caseId,
      })

      const newDraft = mapBackendToFrontend(response)
      setDrafts((prev) => [newDraft, ...prev])
      return newDraft
    },
    [caseId]
  )

  const updateDraft = useCallback(
    async (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => {
      const updateData: { title?: string; body?: string } = {}
      if (updates.title !== undefined) {
        updateData.title = updates.title
      }
      if (updates.content !== undefined) {
        updateData.body = updates.content
      }

      const response = await draftsApi.update(id, updateData)
      const updatedDraft = mapBackendToFrontend(response)

      setDrafts((prev) =>
        prev.map((draft) => (draft.id === id ? updatedDraft : draft))
      )
    },
    []
  )

  const deleteDraft = useCallback(async (id: string) => {
    await draftsApi.delete(id)
    setDrafts((prev) => prev.filter((draft) => draft.id !== id))
  }, [])

  const getDraft = useCallback(
    (id: string): Draft | undefined => {
      return drafts.find((draft) => draft.id === id)
    },
    [drafts]
  )

  return {
    drafts,
    isLoading,
    error,
    addDraft,
    updateDraft,
    deleteDraft,
    getDraft,
    refresh: fetchDrafts,
  }
}

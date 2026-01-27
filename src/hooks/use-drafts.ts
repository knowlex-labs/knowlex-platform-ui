import { useState, useCallback } from 'react'
import type { Draft } from '@/types'

interface UseDraftsResult {
  drafts: Draft[]
  isLoading: boolean
  addDraft: (title: string, content: string) => Draft
  updateDraft: (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => void
  deleteDraft: (id: string) => void
  getDraft: (id: string) => Draft | undefined
}

export function useDrafts(caseId: string): UseDraftsResult {
  const [drafts, setDrafts] = useState<Draft[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`knowlex_drafts_${caseId}`)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.map((d: Draft) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      }))
    }
    return []
  })
  const [isLoading] = useState(false)

  const saveDrafts = useCallback(
    (newDrafts: Draft[]) => {
      localStorage.setItem(`knowlex_drafts_${caseId}`, JSON.stringify(newDrafts))
    },
    [caseId]
  )

  const addDraft = useCallback(
    (title: string, content: string): Draft => {
      const now = new Date()
      const newDraft: Draft = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        content,
        caseId,
        createdAt: now,
        updatedAt: now,
      }
      setDrafts((prev) => {
        const updated = [newDraft, ...prev]
        saveDrafts(updated)
        return updated
      })
      return newDraft
    },
    [caseId, saveDrafts]
  )

  const updateDraft = useCallback(
    (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => {
      setDrafts((prev) => {
        const updated = prev.map((draft) =>
          draft.id === id
            ? { ...draft, ...updates, updatedAt: new Date() }
            : draft
        )
        saveDrafts(updated)
        return updated
      })
    },
    [saveDrafts]
  )

  const deleteDraft = useCallback(
    (id: string) => {
      setDrafts((prev) => {
        const updated = prev.filter((draft) => draft.id !== id)
        saveDrafts(updated)
        return updated
      })
    },
    [saveDrafts]
  )

  const getDraft = useCallback(
    (id: string): Draft | undefined => {
      return drafts.find((draft) => draft.id === id)
    },
    [drafts]
  )

  return {
    drafts,
    isLoading,
    addDraft,
    updateDraft,
    deleteDraft,
    getDraft,
  }
}

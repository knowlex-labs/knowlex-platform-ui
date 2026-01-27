import { useState, useCallback } from 'react'
import type { Note } from '@/types'

interface UseNotesResult {
  notes: Note[]
  isLoading: boolean
  addNote: (title: string, content: string) => Note
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void
  deleteNote: (id: string) => void
  getNote: (id: string) => Note | undefined
}

export function useNotes(caseId: string): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`knowlex_notes_${caseId}`)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.map((n: Note) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      }))
    }
    return []
  })
  const [isLoading] = useState(false)

  const saveNotes = useCallback(
    (newNotes: Note[]) => {
      localStorage.setItem(`knowlex_notes_${caseId}`, JSON.stringify(newNotes))
    },
    [caseId]
  )

  const addNote = useCallback(
    (title: string, content: string): Note => {
      const now = new Date()
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        content,
        caseId,
        createdAt: now,
        updatedAt: now,
      }
      setNotes((prev) => {
        const updated = [newNote, ...prev]
        saveNotes(updated)
        return updated
      })
      return newNote
    },
    [caseId, saveNotes]
  )

  const updateNote = useCallback(
    (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
      setNotes((prev) => {
        const updated = prev.map((note) =>
          note.id === id
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
        saveNotes(updated)
        return updated
      })
    },
    [saveNotes]
  )

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const updated = prev.filter((note) => note.id !== id)
        saveNotes(updated)
        return updated
      })
    },
    [saveNotes]
  )

  const getNote = useCallback(
    (id: string): Note | undefined => {
      return notes.find((note) => note.id === id)
    },
    [notes]
  )

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    getNote,
  }
}

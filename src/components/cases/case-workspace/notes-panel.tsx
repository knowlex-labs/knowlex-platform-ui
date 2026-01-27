import { useState } from 'react'
import { Plus, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Note } from '@/types'
import { NoteCard } from './note-card'
import { NoteEditorModal } from './note-editor-modal'

interface NotesPanelProps {
  notes: Note[]
  onAddNote: (title: string, content: string) => void
  onUpdateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void
  onDeleteNote: (id: string) => void
}

export function NotesPanel({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: NotesPanelProps) {
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleNewNote = () => {
    setEditingNote(null)
    setIsModalOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsModalOpen(true)
  }

  const handleSave = (id: string | null, title: string, content: string) => {
    if (id) {
      onUpdateNote(id, { title, content })
    } else {
      onAddNote(title, content)
    }
  }

  return (
    <div className="flex flex-col h-full bg-ledger-white border border-ledger-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-gray-200">
        <h3 className="text-sm font-semibold text-ledger-black">Notes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewNote}
          className="h-8 gap-2 text-ledger-gray-500 hover:text-ledger-black"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Notes Grid */}
      <ScrollArea className="flex-1 px-4">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-ledger-gray-100 flex items-center justify-center mb-4">
              <StickyNote className="h-5 w-5 text-ledger-gray-400" />
            </div>
            <p className="text-sm text-ledger-gray-500 mb-1">No notes yet</p>
            <p className="text-xs text-ledger-gray-400 max-w-[200px]">
              Create quick notes to remember important details
            </p>
          </div>
        ) : (
          <div className="py-4 grid grid-cols-2 gap-2">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Editor Modal */}
      <NoteEditorModal
        note={editingNote}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}

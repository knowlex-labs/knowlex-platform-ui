import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Note } from '@/types'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <div className="group p-3 rounded-lg border border-kx-card-border bg-kx-card hover:border-ledger-gray-300 hover:shadow-sm transition-all">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium text-kx-primary-900 line-clamp-1 flex-1">
            {note.title || 'Untitled Note'}
          </h4>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(note)}
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => onDelete(note.id)}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-ledger-gray-600 line-clamp-4 flex-1 whitespace-pre-wrap">
          {note.content}
        </p>
        <p className="text-xs text-ledger-gray-400 mt-2 pt-2 border-t border-ledger-gray-200">
          {formatDate(note.updatedAt)}
        </p>
      </div>
    </div>
  )
}

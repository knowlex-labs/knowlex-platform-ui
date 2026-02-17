import { FileText, Pencil, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Draft } from '@/types'

interface DraftItemProps {
  draft: Draft
  onEdit: (draft: Draft) => void
  onDelete: (id: string) => void
  onDownload: (draft: Draft) => void
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trim() + '...'
}

export function DraftItem({ draft, onEdit, onDelete, onDownload }: DraftItemProps) {
  return (
    <div className="group p-3 rounded-lg border border-kx-card-border bg-kx-card hover:border-ledger-gray-300 card-elevated">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded bg-ledger-gray-100 flex items-center justify-center">
          <FileText className="h-4 w-4 text-ledger-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-kx-primary-900 truncate">
            {draft.title}
          </h4>
          <p className="text-xs text-ledger-gray-500 mt-0.5 line-clamp-2">
            {truncateContent(draft.content)}
          </p>
          <p className="text-xs text-ledger-gray-400 mt-1">
            {formatDate(draft.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(draft)}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onDownload(draft)}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => onDelete(draft.id)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

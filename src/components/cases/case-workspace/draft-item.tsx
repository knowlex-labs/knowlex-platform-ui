import { useState } from 'react'
import { FileText, Loader2, AlertCircle, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Draft } from '@/types'

interface DraftItemProps {
  draft: Draft
  onClick: () => void
  onDelete: (id: string) => void
}

export function DraftItem({ draft, onClick, onDelete }: DraftItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(draft.id)
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-4 py-2.5',
        'hover:bg-ledger-gray-50 transition-colors',
        draft.status === 'failed' && 'opacity-60'
      )}
      onMouseLeave={() => setShowMenu(false)}
    >
      <button
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
        onClick={onClick}
      >
        {draft.status === 'pending' ? (
          <Loader2 className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0 animate-spin" />
        ) : draft.status === 'failed' ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
        )}
        <span className="text-sm text-kx-primary-900 truncate flex-1 min-w-0">
          {draft.title}
          {draft.status === 'pending' && (
            <span className="text-ledger-gray-400 ml-1">- Generating...</span>
          )}
          {draft.status === 'failed' && (
            <span className="text-red-400 ml-1">- Failed</span>
          )}
        </span>
      </button>

      {/* Three-dot Menu */}
      <div className="relative flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-kx-primary-700 hover:bg-ledger-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-kx-card border border-kx-card-border rounded-lg shadow-md z-10">
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors rounded-lg disabled:opacity-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

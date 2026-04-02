import { useState, useRef, useEffect } from 'react'
import { FileText, Loader2, AlertCircle, MoreVertical, Trash2, ExternalLink, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { renderDraftToHtml } from '@/lib/draft-renderer'
import type { Draft } from '@/types'

interface DraftItemProps {
  draft: Draft
  onClick: () => void
  onDelete: (id: string) => void
  onRename?: (newTitle: string) => Promise<void>
}

export function DraftItem({ draft, onClick, onDelete, onRename }: DraftItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(draft.id)
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleOpenInNewTab = () => {
    if (!draft.content || draft.status !== 'completed') return
    const html = renderDraftToHtml(draft.content)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setShowMenu(false)
  }

  const displayTitle = draft.title || ''
  const lastDot = displayTitle.lastIndexOf('.')
  const titleStem = lastDot > 0 ? displayTitle.slice(0, lastDot) : displayTitle
  const titleExt = lastDot > 0 ? displayTitle.slice(lastDot) : ''

  const handleStartRename = () => {
    setRenameValue(titleStem)
    setIsRenaming(true)
    setShowMenu(false)
  }

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== titleStem && onRename) {
      try {
        await onRename(trimmed + titleExt)
      } catch {
        // handled by parent
      }
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit()
    else if (e.key === 'Escape') setIsRenaming(false)
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-4 py-1.5 cursor-pointer',
        'hover:bg-ledger-gray-50 transition-colors',
        draft.status === 'failed' && 'opacity-60'
      )}
      onClick={isRenaming ? undefined : onClick}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
        {draft.status === 'pending' ? (
          <Loader2 className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0 animate-spin" />
        ) : draft.status === 'failed' ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
        )}

        {isRenaming ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-kx-primary-900 flex-1 min-w-0 bg-white dark:bg-ledger-gray-800 border border-kx-primary-300 rounded px-1.5 py-0.5 outline-none focus:border-kx-primary-500"
            />
            {titleExt && (
              <span className="text-sm text-ledger-gray-400 flex-shrink-0">{titleExt}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-kx-primary-900 truncate flex-1 min-w-0">
            {draft.title}
            {draft.status === 'pending' && (
              <span className="text-ledger-gray-400 ml-1">- Generating...</span>
            )}
            {draft.status === 'failed' && (
              <span className="text-red-400 ml-1">- Failed</span>
            )}
          </span>
        )}
      </div>

      {/* Three-dot Menu */}
      {!isRenaming && (
        <div className="relative flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-kx-primary-700 hover:bg-ledger-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-kx-card border border-kx-card-border rounded-lg shadow-md z-10">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-primary-900 hover:bg-ledger-gray-50 transition-colors rounded-t-lg disabled:opacity-50"
                onClick={(e) => { e.stopPropagation(); handleOpenInNewTab() }}
                disabled={draft.status !== 'completed' || !draft.content}
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </button>
              {onRename && (
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-primary-900 hover:bg-ledger-gray-50 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleStartRename() }}
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </button>
              )}
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors rounded-b-lg disabled:opacity-50"
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

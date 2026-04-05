import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  FileImage,
  File,
  MoreVertical,
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Pencil,
  FilePen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { workspaceApi } from '@/services/api/workspace-api'
import { DocumentType } from '@/types'
import type { CaseDocument } from '@/types'

interface SourceItemProps {
  source: CaseDocument
  isSelected: boolean
  onToggleSelection: () => void
  onDelete: () => void
  onLinkContent: () => void
  onOpenInTab: (source: CaseDocument, url: string) => void
  onRename: (newName: string) => Promise<void>
  onEditInBrowser?: (source: CaseDocument) => void
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toUpperCase() || ''
  if (['JPG', 'JPEG', 'PNG'].includes(ext)) {
    return FileImage
  }
  if (ext === 'PDF') {
    return FileText
  }
  if (['DOCX', 'DOC'].includes(ext)) {
    return FileText
  }
  return File
}

function getStatusBadge(status: string | undefined | null) {
  const config: Record<string, { color: string; text: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', text: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', text: 'Processing' },
    completed: { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', text: 'Completed' },
    failed: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', text: 'Failed' },
    indexing_pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', text: 'Pending' },
    indexing_running: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', text: 'Processing' },
    indexing_completed: { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', text: 'Completed' },
    indexing_failed: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', text: 'Failed' },
  }

  const normalizedStatus = (!status ? 'indexing_pending' : status.toLowerCase()) || ''
  const statusConfig = config[normalizedStatus]
  const { color, text } = statusConfig || { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status || 'Unknown' }

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${color}`}>
      {text}
    </span>
  )
}

export function SourceItem({
  source,
  isSelected,
  onToggleSelection,
  onDelete,
  onLinkContent,
  onOpenInTab,
  onRename,
  onEditInBrowser,
}: SourceItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const displayName = source.name || `${source.type} Document`
  const Icon = getFileIcon(displayName)
  const fileExt = displayName.split('.').pop()?.toUpperCase() || ''
  const isEditable = ['PDF', 'DOCX', 'DOC'].includes(fileExt)

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleLinkContent = async () => {
    setIsLinking(true)
    try {
      await onLinkContent()
    } finally {
      setIsLinking(false)
      setShowMenu(false)
    }
  }

  // Separate name stem from extension so users can't accidentally remove it
  const lastDot = displayName.lastIndexOf('.')
  const nameStem = lastDot > 0 ? displayName.slice(0, lastDot) : displayName
  const nameExt = lastDot > 0 ? displayName.slice(lastDot) : '' // e.g. ".pdf"

  const handleStartRename = () => {
    setRenameValue(nameStem)
    setIsRenaming(true)
    setShowMenu(false)
  }

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== nameStem) {
      try {
        await onRename(trimmed + nameExt)
      } catch {
        // Error handled by parent
      }
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
    }
  }

  const handleOpenInNewTab = async () => {
    try {
      const url = await workspaceApi.resolveDocumentUrl(source)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Failed to get download URL:', err)
    } finally {
      setShowMenu(false)
    }
  }

  const [isLoadingView, setIsLoadingView] = useState(false)

  const handleView = async () => {
    if (isLoadingView) return

    setIsLoadingView(true)
    try {
      const url = await workspaceApi.resolveDocumentUrl(source)
      onOpenInTab(source, url)
    } catch (err) {
      console.error('Failed to get download URL:', err)
    } finally {
      setIsLoadingView(false)
      setShowMenu(false)
    }
  }

  return (
    // Clicking anywhere on the row toggles selection; filename text stopPropagates to open instead
    <div
      className="group relative flex items-center gap-2 px-4 py-1.5 hover:bg-ledger-gray-50 transition-colors cursor-pointer select-none"
      onClick={onToggleSelection}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Checkbox — click stopPropagated so it doesn't double-toggle with the row onClick */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelection}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 rounded border-ledger-gray-300 text-kx-primary-600 focus:ring-kx-primary-500 flex-shrink-0 cursor-pointer"
      />

      {/* File Icon + Filename — stopPropagation so clicking name opens the file, not toggles */}
      {isRenaming ? (
        <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <Icon className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameSubmit}
            className="text-sm text-kx-primary-900 flex-1 min-w-0 bg-white dark:bg-ledger-gray-800 border border-kx-primary-300 rounded px-1.5 py-0.5 outline-none focus:border-kx-primary-500 cursor-text select-text"
          />
          {nameExt && (
            <span className="text-sm text-ledger-gray-400 flex-shrink-0">{nameExt}</span>
          )}
        </div>
      ) : (
        <button
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={(e) => { e.stopPropagation(); handleView() }}
          disabled={isLoadingView}
          title="Open file"
        >
          {isLoadingView
            ? <Loader2 className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0 animate-spin" />
            : <Icon className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
          }
          <span className="text-sm text-kx-primary-900 truncate flex-1 min-w-0 hover:underline">
            {displayName}
          </span>
        </button>
      )}

      {/* Menu Button */}
      <div className="relative flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-kx-primary-700 hover:bg-ledger-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-kx-card border border-kx-card-border rounded-lg shadow-md z-10">
            {/* File details */}
            <div className="px-3 py-2 border-b border-ledger-gray-100">
              <div className="mt-1">{getStatusBadge(source.type === DocumentType.DRAFT ? source.jobStatus : source.indexingStatus)}</div>
            </div>
            {isEditable && onEditInBrowser && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-primary-900 hover:bg-ledger-gray-50 transition-colors"
                onClick={() => { onEditInBrowser(source); setShowMenu(false) }}
              >
                <FilePen className="h-4 w-4" />
                Edit in Browser
              </button>
            )}
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-primary-900 hover:bg-ledger-gray-50 transition-colors"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-primary-900 hover:bg-ledger-gray-50 transition-colors"
              onClick={handleStartRename}
            >
              <Pencil className="h-4 w-4" />
              Rename
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-primary-600 dark:text-kx-primary-400 hover:bg-kx-primary-50 dark:hover:bg-kx-primary-950 transition-colors disabled:opacity-50"
              onClick={handleLinkContent}
              disabled={isLinking}
            >
              <RefreshCw className="h-4 w-4" />
              {isLinking ? 'Re-indexing...' : 'Re-index'}
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50 rounded-b-lg"
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

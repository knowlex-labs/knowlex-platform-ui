import { useState } from 'react'
import {
  FileText,
  FileImage,
  File,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CaseSource } from '@/types'
/* cn removed */

interface SourceItemProps {
  source: CaseSource
  isSelected: boolean
  onToggleSelection: () => void
  onDelete: () => void
  onLinkContent: () => void
}

function getFileIcon(fileType: string) {
  const type = fileType.toUpperCase()
  if (['JPG', 'JPEG', 'PNG'].includes(type)) {
    return FileImage
  }
  if (type === 'PDF') {
    return FileText
  }
  if (['DOCX', 'DOC'].includes(type)) {
    return FileText
  }
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusBadge(status: CaseSource['indexingStatus'] | undefined | null) {
  const config: Record<string, { color: string; text: string }> = {
    INDEXING_PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Pending' },
    INDEXING: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Indexing' },
    INDEXED: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Indexed' },
    INDEXING_FAILED: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Failed' },
  }

  const statusConfig = status && config[status]
  const { color, text } = statusConfig || { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Unknown' }

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
}: SourceItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  const Icon = getFileIcon(source.fileType)

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

  const handleView = () => {
    window.open(source.storageUrl, '_blank')
    setShowMenu(false)
  }

  return (
    <div
      className="group relative flex items-center gap-2 px-3 py-2 hover:bg-ledger-gray-50 transition-colors border-b border-ledger-gray-100"
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelection}
        className="h-3.5 w-3.5 rounded border-ledger-gray-300 text-ledger-black focus:ring-ledger-black flex-shrink-0"
      />

      {/* File Icon */}
      <Icon className="h-4 w-4 text-ledger-gray-400 flex-shrink-0" />

      {/* Filename only */}
      <span className="text-xs text-ledger-black truncate flex-1 min-w-0">
        {source.filename}
      </span>

      {/* Menu Button */}
      <div className="relative flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-ledger-black hover:bg-ledger-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-ledger-white border border-ledger-gray-200 rounded-lg shadow-md z-10">
            {/* File details */}
            <div className="px-3 py-2 border-b border-ledger-gray-100">
              <p className="text-xs text-ledger-gray-500">{formatFileSize(source.fileSize)}</p>
              <div className="mt-1">{getStatusBadge(source.indexingStatus)}</div>
            </div>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ledger-black hover:bg-ledger-gray-50 transition-colors"
              onClick={handleView}
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
              onClick={handleLinkContent}
              disabled={isLinking}
            >
              <RefreshCw className="h-4 w-4" />
              {isLinking ? 'Re-indexing...' : 'Re-index'}
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 rounded-b-lg"
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

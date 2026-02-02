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

function getStatusBadge(status: CaseSource['indexingStatus']) {
  const config = {
    INDEXING_PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Pending' },
    INDEXING: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Indexing' },
    INDEXED: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Indexed' },
    INDEXING_FAILED: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Failed' },
  }

  const { color, text } = config[status]
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${color}`}>
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
  const showLinkAction = source.indexingStatus === 'INDEXING_PENDING' ||
    source.indexingStatus === 'INDEXING_FAILED'

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
      className="group relative flex items-center gap-2 px-3 py-2 hover:bg-ledger-gray-50 transition-colors"
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
      <Icon className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0" />

      {/* File Info - single line */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span
          className="text-xs text-ledger-black truncate flex-1 min-w-0"
          title={source.filename}
        >
          {source.filename}
        </span>
        <span className="text-[10px] text-ledger-gray-400 flex-shrink-0">
          {formatFileSize(source.fileSize)}
        </span>
        {getStatusBadge(source.indexingStatus)}
      </div>

      {/* Menu Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-ledger-black hover:bg-ledger-gray-100 transition-colors"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-ledger-white border border-ledger-gray-200 rounded shadow-lg z-10">
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ledger-black hover:bg-ledger-gray-50 transition-colors"
              onClick={handleView}
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            {showLinkAction && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                onClick={handleLinkContent}
                disabled={isLinking}
              >
                <RefreshCw className="h-4 w-4" />
                {isLinking ? 'Linking...' : 'Link Content'}
              </button>
            )}
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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

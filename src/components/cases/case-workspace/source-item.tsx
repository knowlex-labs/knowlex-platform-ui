import { useState } from 'react'
import {
  FileText,
  FileImage,
  File,
  MoreVertical,
  Eye,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CaseSource } from '@/types'
import { cn } from '@/lib/utils'

interface SourceItemProps {
  source: CaseSource
  isSelected: boolean
  onToggleSelection: () => void
  onView: () => void
  onDelete: () => void
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

export function SourceItem({
  source,
  isSelected,
  onToggleSelection,
  onView,
  onDelete,
}: SourceItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  return (
    <div
      className="group relative flex items-center gap-3 px-4 py-3 hover:bg-ledger-gray-50 transition-colors"
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelection}
        className="h-4 w-4 rounded border-ledger-gray-300 text-ledger-black focus:ring-ledger-black flex-shrink-0"
      />

      {/* File Icon */}
      <Icon className="h-4 w-4 text-ledger-gray-400 flex-shrink-0" />

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ledger-black truncate" title={source.filename}>
          {source.filename}
        </p>
        <p className="text-xs text-ledger-gray-400">
          {formatFileSize(source.fileSize)}
        </p>
      </div>

      {/* Menu Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
            showMenu && 'opacity-100'
          )}
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-ledger-white border border-ledger-gray-200 rounded shadow-lg z-10">
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ledger-black hover:bg-ledger-gray-50 transition-colors"
              onClick={() => {
                onView()
                setShowMenu(false)
              }}
            >
              <Eye className="h-4 w-4" />
              View
            </button>
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

import { useState, useRef, useEffect } from 'react'
import { FolderOpen, User, Calendar, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { caseApi } from '@knowlex/core/api'
import { EditCaseModal } from './edit-case-modal'
import type { CaseStatus } from '@knowlex/core/types'
import type { CaseWithClient } from '@/hooks/use-cases-with-clients'

interface CaseFolderCardProps {
  caseItem: CaseWithClient
  onClick: () => void
  onRefresh: () => void
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm',
        STATUS_COLORS[status]
      )}
    >
      {label}
    </span>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function CaseFolderCard({ caseItem, onClick, onRefresh }: CaseFolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await caseApi.delete(caseItem.id)
      onRefresh()
    } catch {
      // Let user retry via the menu
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          'group relative w-full p-4 text-left rounded-lg border border-kx-card-border cursor-pointer',
          'bg-kx-card shadow-sm card-elevated',
          'hover:border-ledger-gray-300',
          'active:bg-ledger-gray-50',
          'flex flex-col gap-3'
        )}
      >
        {/* Three-dot menu */}
        <div
          ref={menuRef}
          className="absolute top-2 right-2 z-10"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((prev) => !prev)
            }}
            className="p-1.5 rounded-md text-ledger-gray-400 hover:text-ledger-gray-600 hover:bg-ledger-gray-100 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-kx-card border border-kx-card-border rounded-md shadow-lg py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  setShowEditModal(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-kx-primary-900 hover:bg-ledger-gray-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  setShowDeleteDialog(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Header with folder icon */}
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-lg bg-kx-primary-50 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-kx-primary-500" />
          </div>
        </div>

        {/* Title and case number */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-kx-primary-900 line-clamp-2">
            {caseItem.caseTitle || 'Untitled Case'}
          </h3>
          {caseItem.caseNumber && (
            <code className="text-xs font-mono text-ledger-gray-500 mt-1 block">
              {caseItem.caseNumber}
            </code>
          )}
        </div>

        {/* Client, date info, and status */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-ledger-gray-100">
          {caseItem.clientName && (
            <div className="flex items-center gap-1.5 text-xs text-ledger-gray-500">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{caseItem.clientName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-ledger-gray-400">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDate(caseItem.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={caseItem.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditCaseModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        caseId={caseItem.id}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete case?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{caseItem.caseTitle || 'Untitled Case'}&quot;.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

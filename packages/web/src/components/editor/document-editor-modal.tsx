import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentEditor } from './document-editor'

interface DocumentEditorModalProps {
  documentId: string
  documentTitle?: string
  onClose: () => void
}

/**
 * Fullscreen overlay hosting the canonical DocumentEditor. Used by call-sites
 * that previously opened OnlyOfficeEditor (case workspace, documents page) so
 * the migration is a one-import-swap.
 */
export function DocumentEditorModal({
  documentId,
  documentTitle,
  onClose,
}: DocumentEditorModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-ledger-gray-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-ledger-gray-200 dark:border-ledger-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-kx-primary-900 dark:text-kx-primary-100">
          {documentTitle ?? 'Edit document'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-kx-primary-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <DocumentEditor documentId={documentId} documentTitle={documentTitle} />
      </div>
    </div>
  )
}

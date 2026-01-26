import { X, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { CaseSource } from '@/types'

interface FileViewerModalProps {
  source: CaseSource | null
  onClose: () => void
}

export function FileViewerModal({ source, onClose }: FileViewerModalProps) {
  if (!source) return null

  const isImage = source.fileType.startsWith('image/')
  const isPdf = source.fileType === 'application/pdf'

  const handleOpenExternal = () => {
    window.open(source.s3Url, '_blank')
  }

  return (
    <Dialog open={!!source} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-ledger-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{source.fileName}</DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-ledger-gray-100">
          {isPdf && (
            <iframe
              src={source.s3Url}
              className="w-full h-full border-0"
              title={source.fileName}
            />
          )}
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={source.s3Url}
                alt={source.fileName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-ledger-gray-500 mb-4">
                  Preview not available for this file type
                </p>
                <Button onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open file
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { workspaceApi } from '@/services/api/workspace-api'
import type { CaseDocument } from '@/types'

interface FileViewerModalProps {
  source: CaseDocument | null
  onClose: () => void
}

export function FileViewerModal({ source, onClose }: FileViewerModalProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!source) return

    // Fetch download URL when modal opens
    setIsLoading(true)
    setError(null)
    workspaceApi.getDownloadUrl(source.id)
      .then(setDownloadUrl)
      .catch((err) => {
        console.error('Failed to get download URL:', err)
        setError('Unable to load document. Please try again.')
      })
      .finally(() => setIsLoading(false))
  }, [source?.id])

  if (!source) return null

  const ext = source.name.split('.').pop()?.toUpperCase() || ''
  const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext)
  const isPdf = ext === 'PDF'

  const handleOpenExternal = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  return (
    <Dialog open={!!source} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-ledger-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{source.name}</DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                disabled={!downloadUrl}
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
          {isLoading && (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-ledger-gray-400" aria-label="Loading document" />
            </div>
          )}
          {!isLoading && error && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <Button onClick={onClose}>Close</Button>
              </div>
            </div>
          )}
          {!isLoading && !error && isPdf && downloadUrl && (
            <iframe
              src={downloadUrl}
              className="w-full h-full border-0"
              title={source.name}
            />
          )}
          {!isLoading && !error && isImage && downloadUrl && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={downloadUrl}
                alt={source.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          {!isLoading && !error && !isPdf && !isImage && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-ledger-gray-500 mb-4">
                  Preview not available for this file type
                </p>
                <Button onClick={handleOpenExternal} disabled={!downloadUrl}>
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

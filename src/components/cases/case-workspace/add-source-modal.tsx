import { useState, useRef } from 'react'
import { Upload, File, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AddSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AddSourceModal({
  open,
  onOpenChange,
  onUpload,
  isUploading,
}: AddSourceModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Map<string, 'pending' | 'uploading' | 'done' | 'error'>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      addFiles(files)
    }
  }

  const addFiles = (files: File[]) => {
    // Filter out duplicates by name
    const existingNames = new Set(selectedFiles.map((f) => f.name))
    const newFiles = files.filter((f) => !existingNames.has(f.name))
    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName))
    setUploadProgress((prev) => {
      const next = new Map(prev)
      next.delete(fileName)
      return next
    })
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    // Initialize progress for all files
    const initialProgress = new Map<string, 'pending' | 'uploading' | 'done' | 'error'>()
    selectedFiles.forEach((f) => initialProgress.set(f.name, 'pending'))
    setUploadProgress(initialProgress)

    // Upload files sequentially
    for (const file of selectedFiles) {
      setUploadProgress((prev) => new Map(prev).set(file.name, 'uploading'))
      try {
        await onUpload(file)
        setUploadProgress((prev) => new Map(prev).set(file.name, 'done'))
      } catch {
        setUploadProgress((prev) => new Map(prev).set(file.name, 'error'))
      }
    }

    // Close modal after all uploads
    setTimeout(() => {
      setSelectedFiles([])
      setUploadProgress(new Map())
      onOpenChange(false)
    }, 500)
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([])
      setUploadProgress(new Map())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sources</DialogTitle>
          <DialogDescription>
            Upload documents to analyze in your case workspace
          </DialogDescription>
        </DialogHeader>

        {/* Drop Zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            isDragging
              ? 'border-ledger-black bg-ledger-gray-50'
              : 'border-ledger-gray-300 hover:border-ledger-gray-400'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto text-ledger-gray-400 mb-3" />
          <p className="text-sm text-ledger-black mb-1">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-ledger-gray-400">
            PDF, Word, Excel, images, and text files
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp"
          />
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file) => {
              const status = uploadProgress.get(file.name)
              return (
                <div
                  key={file.name}
                  className="flex items-center gap-3 p-2 bg-ledger-gray-50 rounded"
                >
                  <File className="h-4 w-4 text-ledger-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ledger-black truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-ledger-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                  )}
                  {status === 'done' && (
                    <span className="text-xs text-green-600">Done</span>
                  )}
                  {status === 'error' && (
                    <span className="text-xs text-red-600">Error</span>
                  )}
                  {!status && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.name)
                      }}
                      className="p-1 hover:bg-ledger-gray-200 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-ledger-gray-400" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

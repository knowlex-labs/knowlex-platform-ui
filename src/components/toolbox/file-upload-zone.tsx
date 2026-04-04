import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FileUploadZoneHandle {
  triggerClick: () => void
}

interface FileUploadZoneProps {
  accept: string
  multiple?: boolean
  onFilesSelected: (files: File[]) => void
  label?: string
  selectedFiles?: File[]
  onRemoveFile?: (index: number) => void
}

export const FileUploadZone = forwardRef<FileUploadZoneHandle, FileUploadZoneProps>(
  function FileUploadZone(
    {
      accept,
      multiple = false,
      onFilesSelected,
      label = 'Drop your file here or click to browse',
      selectedFiles = [],
      onRemoveFile,
    },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    useImperativeHandle(ref, () => ({
      triggerClick: () => inputRef.current?.click(),
    }))

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = () => setIsDragging(false)

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) onFilesSelected(multiple ? files : [files[0]])
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) onFilesSelected(multiple ? files : [files[0]])
      // Reset so the same file can be re-selected
      e.target.value = ''
    }

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
      <div className="space-y-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
            'text-center select-none',
            isDragging
              ? 'border-kx-primary-500 bg-kx-primary-50 dark:bg-kx-primary-950/20'
              : 'border-ledger-gray-300 dark:border-ledger-gray-600 hover:border-kx-primary-400 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/40'
          )}
        >
          <Upload className="h-8 w-8 text-ledger-gray-400 dark:text-ledger-gray-500" />
          <p className="text-sm text-ledger-gray-600 dark:text-ledger-gray-400">{label}</p>
          <p className="text-xs text-ledger-gray-400 dark:text-ledger-gray-500">
            {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        {selectedFiles.length > 0 && (
          <ul className="space-y-2">
            {selectedFiles.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-700 bg-ledger-gray-50 dark:bg-ledger-gray-800/40 px-3 py-2"
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-kx-primary-500" />
                <span className="flex-1 truncate text-sm text-kx-text-primary">{file.name}</span>
                <span className="text-xs text-ledger-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemoveFile(i) }}
                    className="flex-shrink-0 rounded p-0.5 text-ledger-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)

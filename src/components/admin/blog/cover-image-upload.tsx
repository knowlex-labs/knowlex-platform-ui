import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, X } from 'lucide-react'

interface CoverImageUploadProps {
  previewUrl: string | null
  onUpload: (file: File) => void
  onRemove: () => void
}

export function CoverImageUpload({ previewUrl, onUpload, onRemove }: CoverImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-ledger-200 dark:border-ledger-800">
          <img src={previewUrl} alt="Cover preview" className="w-full aspect-[16/9] object-cover" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[16/9] rounded-lg border-2 border-dashed border-ledger-300 dark:border-ledger-700 flex flex-col items-center justify-center gap-2 text-kx-text-secondary hover:border-kx-primary-400 hover:text-kx-primary-600 transition-colors"
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-sm font-medium">Upload cover image</span>
        </button>
      )}

      {previewUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => fileInputRef.current?.click()}
        >
          Replace image
        </Button>
      )}
    </div>
  )
}

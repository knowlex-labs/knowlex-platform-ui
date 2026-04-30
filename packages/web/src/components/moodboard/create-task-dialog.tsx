import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUploadZone } from '@/components/toolbox/file-upload-zone'
import type {
  CreateTaskRequest,
  MoodboardStatus,
  MoodboardTask,
} from '@knowlex/core/types'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: MoodboardStatus
  statusLabel: string
  onCreate: (data: CreateTaskRequest) => Promise<MoodboardTask | null>
  onUploadImage: (taskId: string, file: File) => Promise<void>
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  status,
  statusLabel,
  onCreate,
  onUploadImage,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'creating' | 'uploading'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setImageFile(null)
    setImagePreview(null)
    setPhase('idle')
    setError(null)
  }, [open])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const isBusy = phase !== 'idle'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError(null)
    setPhase('creating')
    try {
      const created = await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
      })
      if (!created) {
        setError('Could not create the task')
        setPhase('idle')
        return
      }
      if (imageFile) {
        setPhase('uploading')
        await onUploadImage(created.id, imageFile)
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('idle')
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isBusy) onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            New task <span className="text-sm font-normal font-sans text-ledger-gray-500">· {statusLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-task-title">Title *</Label>
            <Input
              id="new-task-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="What needs doing?"
              autoFocus
              disabled={isBusy}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-task-description">Description</Label>
            <Textarea
              id="new-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={4}
              disabled={isBusy}
            />
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-ledger-gray-200 dark:border-ledger-gray-700">
                <img src={imagePreview} alt="" className="w-full max-h-56 object-contain bg-ledger-gray-50 dark:bg-ledger-gray-900" />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  disabled={isBusy}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <FileUploadZone
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onFilesSelected={(files) => setImageFile(files[0] ?? null)}
                label="Drop an image or click to browse"
              />
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {phase === 'creating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : phase === 'uploading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading image...
                </>
              ) : (
                'Create task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

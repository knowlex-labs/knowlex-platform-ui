import { useEffect, useState } from 'react'
import { Loader2, Trash2, X } from 'lucide-react'
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
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileUploadZone } from '@/components/toolbox/file-upload-zone'
import type {
  MoodboardStatus,
  MoodboardTask,
  UpdateTaskRequest,
} from '@knowlex/core/types'

interface TaskDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: MoodboardTask
  onUpdate: (data: UpdateTaskRequest) => Promise<void>
  onDelete: () => Promise<void>
  onUploadImage: (file: File) => Promise<void>
  onRemoveImage: () => Promise<void>
}

const STATUS_OPTIONS: { value: MoodboardStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  onUpdate,
  onDelete,
  onUploadImage,
  onRemoveImage,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState<MoodboardStatus>(task.status)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setStatus(task.status)
  }, [task.id])

  const handleSave = async () => {
    const patch: UpdateTaskRequest = {}
    if (title.trim() !== task.title) patch.title = title.trim()
    if ((description.trim() || null) !== (task.description ?? null)) {
      patch.description = description.trim()
    }
    if (status !== task.status) patch.status = status

    if (Object.keys(patch).length === 0) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(patch)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileSelected = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setIsUploading(true)
    try {
      await onUploadImage(file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    setIsUploading(true)
    try {
      await onRemoveImage()
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && !isUploading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-edit-title">Title</Label>
            <Input
              id="task-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-edit-description">Description</Label>
            <Textarea
              id="task-edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-edit-status">Status</Label>
            <Select
              id="task-edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MoodboardStatus)}
              disabled={isSaving}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            {task.imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-ledger-gray-200 dark:border-ledger-gray-700">
                <img src={task.imageUrl} alt="" className="w-full max-h-64 object-contain bg-ledger-gray-50 dark:bg-ledger-gray-900" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                  aria-label="Remove image"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : isUploading ? (
              <div className="flex items-center gap-2 p-4 border border-dashed border-ledger-gray-300 rounded-lg text-sm text-ledger-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            ) : (
              <FileUploadZone
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onFilesSelected={handleFileSelected}
                label="Drop an image or click to browse"
              />
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDelete(true)}
            disabled={isSaving || isUploading}
            className="sm:mr-auto border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isUploading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || isUploading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>

        {confirmDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDelete(false)}>
            <div className="bg-kx-card rounded-lg shadow-xl w-full max-w-sm p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-semibold">Delete this task?</h3>
              <p className="text-sm text-ledger-gray-500">This cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                  onClick={async () => {
                    setConfirmDelete(false)
                    await onDelete()
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

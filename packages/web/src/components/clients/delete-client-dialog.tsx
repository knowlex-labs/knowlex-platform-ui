import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { clientApi } from '@knowlex/core/api'

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  linkedCaseCount?: number
  onSuccess: () => void
}

export function DeleteClientDialog({ open, onOpenChange, clientId, clientName, linkedCaseCount = 0, onSuccess }: DeleteClientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await clientApi.delete(clientId)

      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete client')
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete client'
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isDeleting) {
      if (!isOpen) setError(null)
      onOpenChange(isOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-kx-primary-900">{clientName}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {linkedCaseCount > 0 && (
          <div className="p-3 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
            This will unlink <span className="font-semibold">{linkedCaseCount} case{linkedCaseCount === 1 ? '' : 's'}</span> from this client.
            The case{linkedCaseCount === 1 ? '' : 's'} and {linkedCaseCount === 1 ? 'its' : 'their'} documents will remain — you can re-assign {linkedCaseCount === 1 ? 'it' : 'them'} to another client.
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
            {error}
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

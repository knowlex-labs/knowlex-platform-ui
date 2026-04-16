import { useState, useEffect } from 'react'
import { Download, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Draft } from '@knowlex/core/types'

interface DraftEditorModalProps {
  draft: Draft | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string | null, title: string, content: string) => void
  onDownload: (title: string, content: string) => void
}

export function DraftEditorModal({
  draft,
  isOpen,
  onClose,
  onSave,
  onDownload,
}: DraftEditorModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (draft) {
      setTitle(draft.title)
      setContent(draft.content)
    } else {
      setTitle('')
      setContent('')
    }
  }, [draft])

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return
    onSave(draft?.id ?? null, title.trim(), content.trim())
    onClose()
  }

  const handleDownload = () => {
    if (!title.trim() || !content.trim()) return
    onDownload(title.trim(), content.trim())
  }

  const isValid = title.trim() && content.trim()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{draft ? 'Edit Draft' : 'New Draft'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          <div className="space-y-2">
            <Label htmlFor="draft-title">Title</Label>
            <Input
              id="draft-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter draft title..."
            />
          </div>

          <div className="space-y-2 flex-1">
            <Label htmlFor="draft-content">Content</Label>
            <Textarea
              id="draft-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter draft content..."
              className="min-h-[300px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!isValid}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleSave} disabled={!isValid} className="gap-2">
            <Save className="h-4 w-4" />
            Save to Drafts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

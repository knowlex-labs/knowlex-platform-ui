import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
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
import type { Note } from '@/types'

interface NoteEditorModalProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string | null, title: string, content: string) => void
}

export function NoteEditorModal({
  note,
  isOpen,
  onClose,
  onSave,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    } else {
      setTitle('')
      setContent('')
    }
  }, [note])

  const handleSave = () => {
    if (!content.trim()) return
    onSave(note?.id ?? null, title.trim(), content.trim())
    onClose()
  }

  const isValid = content.trim()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'New Note'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Title (optional)</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              className="min-h-[150px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

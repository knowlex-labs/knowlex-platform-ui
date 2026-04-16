import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Draft } from '@knowlex/core/types'
import { DraftItem } from './draft-item'
import { DraftEditorModal } from './draft-editor-modal'

interface DraftsPanelProps {
  drafts: Draft[]
  onAddDraft: (title: string, content: string) => void
  onUpdateDraft: (id: string, updates: Partial<Pick<Draft, 'title' | 'content'>>) => void
  onDeleteDraft: (id: string) => void
}

function downloadDraft(title: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function DraftsPanel({
  drafts,
  onAddDraft,
  onUpdateDraft,
  onDeleteDraft,
}: DraftsPanelProps) {
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleNewDraft = () => {
    setEditingDraft(null)
    setIsModalOpen(true)
  }

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft)
    setIsModalOpen(true)
  }

  const handleSave = (id: string | null, title: string, content: string) => {
    if (id) {
      onUpdateDraft(id, { title, content })
    } else {
      onAddDraft(title, content)
    }
  }

  const handleDownloadFromModal = (title: string, content: string) => {
    downloadDraft(title, content)
  }

  return (
    <div className="flex flex-col h-full bg-kx-card border border-kx-card-border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-gray-200">
        <h3 className="text-sm font-semibold text-kx-primary-900">Drafts</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewDraft}
          className="h-8 gap-2 text-ledger-gray-500 hover:text-kx-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Drafts List */}
      <ScrollArea className="flex-1 px-4">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-ledger-gray-100 flex items-center justify-center mb-4">
              <FileText className="h-5 w-5 text-ledger-gray-400" />
            </div>
            <p className="text-sm text-ledger-gray-500 mb-1">No drafts yet</p>
            <p className="text-xs text-ledger-gray-400 max-w-[200px]">
              Save AI-generated content or create your own drafts
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            {drafts.map((draft) => (
              <DraftItem
                key={draft.id}
                draft={draft}
                onClick={() => handleEditDraft(draft)}
                onDelete={onDeleteDraft}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Editor Modal */}
      <DraftEditorModal
        draft={editingDraft}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDownload={handleDownloadFromModal}
      />
    </div>
  )
}

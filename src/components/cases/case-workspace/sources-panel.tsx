import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CaseSource } from '@/types'
import { SourceItem } from './source-item'
import { AddSourceModal } from './add-source-modal'
import { FileViewerModal } from './file-viewer-modal'

interface SourcesPanelProps {
  sources: CaseSource[]
  selectedSourceIds: Set<string>
  isLoading: boolean
  isUploading: boolean
  onToggleSelection: (sourceId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onUploadFile: (file: File) => Promise<void>
  onDeleteSource: (sourceId: string) => Promise<void>
  onLinkContent: (sourceId: string) => Promise<void>
  onBatchDelete: (sourceIds: string[]) => Promise<void>
  onBatchLinkContent: (sourceIds: string[]) => Promise<void>
}

export function SourcesPanel({
  sources,
  selectedSourceIds,
  isLoading,
  isUploading,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onUploadFile,
  onDeleteSource,
  onLinkContent,
  onBatchDelete,
  onBatchLinkContent,
}: SourcesPanelProps) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [viewingSource, setViewingSource] = useState<CaseSource | null>(null)

  const allSelected = sources.length > 0 && selectedSourceIds.size === sources.length
  const someSelected = selectedSourceIds.size > 0 && selectedSourceIds.size < sources.length

  const handleSelectAllToggle = () => {
    if (allSelected || someSelected) {
      onDeselectAll()
    } else {
      onSelectAll()
    }
  }

  const handleViewSource = (source: CaseSource) => {
    // Check if file type is viewable in modal (PDF or image)
    const viewableTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (viewableTypes.includes(source.fileType)) {
      setViewingSource(source)
    } else {
      // Open in new tab for other file types
      window.open(source.storageUrl, '_blank')
    }
  }

  const handleDeleteSource = async (sourceId: string) => {
    await onDeleteSource(sourceId)
  }

  const handleLinkContent = async (sourceId: string) => {
    await onLinkContent(sourceId)
  }

  return (
    <div className="flex flex-col h-full bg-ledger-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ledger-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ledger-black">Sources</h3>
          {selectedSourceIds.size > 0 && (
            <span className="text-xs text-ledger-gray-500">
              {selectedSourceIds.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Add Sources Button */}
      <div className="px-4 py-3 border-b border-ledger-gray-100">
        <Button
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => setAddModalOpen(true)}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add sources
        </Button>
      </div>

      {/* Select All */}
      {sources.length > 0 && (
        <div className="px-4 py-2 border-b border-ledger-gray-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected
              }}
              onChange={handleSelectAllToggle}
              className="h-4 w-4 rounded border-ledger-gray-300 text-ledger-black focus:ring-ledger-black"
            />
            <span className="text-sm text-ledger-gray-600">
              Select all sources
            </span>
          </label>
        </div>
      )}

      {/* Sources List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-ledger-gray-400" />
          </div>
        ) : sources.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-ledger-gray-500">No sources added yet</p>
            <p className="text-xs text-ledger-gray-400 mt-1">
              Click "Add sources" to upload documents
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ledger-gray-100">
            {sources.map((source) => (
              <SourceItem
                key={source.id}
                source={source}
                isSelected={selectedSourceIds.has(source.id)}
                onToggleSelection={() => onToggleSelection(source.id)}
                onView={() => handleViewSource(source)}
                onDelete={() => handleDeleteSource(source.id)}
                onLinkContent={() => handleLinkContent(source.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Source count */}
      {sources.length > 0 && (
        <div className="px-4 py-2 border-t border-ledger-gray-200 bg-ledger-gray-50">
          <p className="text-xs text-ledger-gray-500">
            {selectedSourceIds.size} of {sources.length} selected
          </p>
        </div>
      )}

      {/* Modals */}
      <AddSourceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onUpload={onUploadFile}
        isUploading={isUploading}
      />

      <FileViewerModal
        source={viewingSource}
        onClose={() => setViewingSource(null)}
      />
    </div>
  )
}

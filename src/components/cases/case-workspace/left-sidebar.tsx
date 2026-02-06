import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CaseSource, Draft } from '@/types'
import { SourceItem } from './source-item'
import { AddSourceModal } from './add-source-modal'

interface LeftSidebarProps {
  sources: CaseSource[]
  selectedSourceIds: Set<string>
  isSourcesLoading: boolean
  isUploading: boolean
  drafts: Draft[]
  onToggleSourceSelection: (sourceId: string) => void
  onSelectAllSources: () => void
  onDeselectAllSources: () => void
  onUploadFile: (file: File) => Promise<void>
  onDeleteSource: (sourceId: string) => Promise<void>
  onLinkContent: (sourceId: string) => Promise<void>
  onDraftClick: (draft: Draft) => void
}

export function LeftSidebar({
  sources,
  selectedSourceIds,
  isSourcesLoading,
  isUploading,
  drafts,
  onToggleSourceSelection,
  onSelectAllSources,
  onDeselectAllSources,
  onUploadFile,
  onDeleteSource,
  onLinkContent,
  onDraftClick,
}: LeftSidebarProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [draftsExpanded, setDraftsExpanded] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const allSelected = sources.length > 0 && selectedSourceIds.size === sources.length
  const someSelected = selectedSourceIds.size > 0 && selectedSourceIds.size < sources.length

  const handleSelectAllToggle = () => {
    if (allSelected || someSelected) {
      onDeselectAllSources()
    } else {
      onSelectAllSources()
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-ledger-white">
      <div className="flex-1 overflow-y-auto">
        {/* Sources Section */}
        <div className="pb-2">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
          >
            <div className="flex items-center gap-2">
              {sourcesExpanded ? (
                <ChevronDown className="h-4 w-4 text-ledger-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-ledger-gray-500" />
              )}
              <span className="text-sm font-semibold text-ledger-black">Sources</span>
              {sources.length > 0 && (
                <span className="text-xs text-ledger-gray-400 px-1.5">
                  {sources.length}
                </span>
              )}
            </div>
            {selectedSourceIds.size > 0 && (
              <span className="text-xs text-ledger-gray-500">
                {selectedSourceIds.size} selected
              </span>
            )}
          </button>

          {sourcesExpanded && (
            <div>
              {/* Add Sources Button */}
              <div className="px-4 pt-1 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 gap-2 bg-ledger-gray-100 hover:bg-ledger-gray-200 border-ledger-gray-200 text-ledger-black text-xs font-normal"
                  onClick={() => setAddModalOpen(true)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add sources
                </Button>
              </div>

              {/* Select All */}
              {sources.length > 0 && (
                <div className="px-4 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected
                      }}
                      onChange={handleSelectAllToggle}
                      className="h-3.5 w-3.5 rounded border-ledger-gray-300 text-ledger-black focus:ring-ledger-black"
                    />
                    <span className="text-xs text-ledger-gray-600">Select all</span>
                  </label>
                </div>
              )}

              {/* Sources List */}
              {isSourcesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                </div>
              ) : sources.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">No sources added</p>
                </div>
              ) : (
                <div>
                  {sources.map((source) => (
                    <SourceItem
                      key={source.id}
                      source={source}
                      isSelected={selectedSourceIds.has(source.id)}
                      onToggleSelection={() => onToggleSourceSelection(source.id)}
                      onDelete={() => onDeleteSource(source.id)}
                      onLinkContent={() => onLinkContent(source.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drafts Section */}
        <div>
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setDraftsExpanded(!draftsExpanded)}
          >
            <div className="flex items-center gap-2">
              {draftsExpanded ? (
                <ChevronDown className="h-4 w-4 text-ledger-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-ledger-gray-500" />
              )}
              <span className="text-sm font-semibold text-ledger-black">Drafts</span>
              {drafts.length > 0 && (
                <span className="text-xs text-ledger-gray-400 px-1.5">
                  {drafts.length}
                </span>
              )}
            </div>
          </button>

          {draftsExpanded && (
            <div className="pb-2">
              {drafts.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">No drafts yet</p>
                  <p className="text-xs text-ledger-gray-400 mt-1">
                    Use Tools to create drafts
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {drafts.map((draft) => (
                    <button
                      key={draft.id}
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2 text-left',
                        'hover:bg-ledger-gray-50 transition-colors'
                      )}
                      onClick={() => onDraftClick(draft)}
                    >
                      <FileText className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ledger-black truncate">
                          {draft.title}
                        </p>
                        <p className="text-xs text-ledger-gray-400 truncate">
                          {draft.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddSourceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onUpload={onUploadFile}
        isUploading={isUploading}
      />
    </div>
  )
}

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CaseSource, Draft } from '@/types'
import { SourceItem } from './source-item'
import { DraftItem } from './draft-item'
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
  onDeleteDraft: (id: string) => void
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
  onDeleteDraft,
}: LeftSidebarProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [draftsExpanded, setDraftsExpanded] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const allSourcesSelected = sources.length > 0 && selectedSourceIds.size === sources.length
  const someSourcesSelected = selectedSourceIds.size > 0 && selectedSourceIds.size < sources.length

  const handleSourcesSelectAll = () => {
    if (allSourcesSelected || someSourcesSelected) {
      onDeselectAllSources()
    } else {
      onSelectAllSources()
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-kx-card">
      <div className="flex-1 overflow-y-auto">
        {/* Sources Section */}
        <div className="pb-2">
          <div className="flex items-center px-4 py-3 hover:bg-ledger-gray-50 transition-colors">
            {sources.length > 0 && (
              <input
                type="checkbox"
                checked={allSourcesSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSourcesSelected
                }}
                onChange={handleSourcesSelectAll}
                onClick={(e) => e.stopPropagation()}
                className="h-3.5 w-3.5 rounded border-ledger-gray-300 text-kx-primary-600 focus:ring-kx-primary-500 flex-shrink-0 mr-2"
              />
            )}
            <button
              className="flex-1 flex items-center justify-between"
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
            >
              <div className="flex items-center gap-2">
                {sourcesExpanded ? (
                  <ChevronDown className="h-4 w-4 text-ledger-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-ledger-gray-500" />
                )}
                <span className="text-sm font-semibold text-kx-primary-900">Sources</span>
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
          </div>

          {sourcesExpanded && (
            <div>
              {/* Add Sources Button */}
              <div className="px-4 pt-1 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 gap-2 bg-ledger-gray-100 hover:bg-ledger-gray-200 border-ledger-gray-200 text-kx-primary-700 text-xs font-normal"
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

        {/* Divider between sections */}
        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* Drafts Section */}
        <div>
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setDraftsExpanded(!draftsExpanded)}
          >
            {draftsExpanded ? (
              <ChevronDown className="h-4 w-4 text-ledger-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-ledger-gray-500" />
            )}
            <span className="text-sm font-semibold text-kx-primary-900">Drafts</span>
            {drafts.length > 0 && (
              <span className="text-xs text-ledger-gray-400 px-1.5">
                {drafts.length}
              </span>
            )}
          </button>

          {draftsExpanded && (
            <div className="pb-2">
              {drafts.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">No drafts yet</p>
                  <p className="text-xs text-ledger-gray-400 mt-1">
                    Use the Drafts button to create one.
                  </p>
                </div>
              ) : (
                <div>
                  {drafts.map((draft) => (
                    <DraftItem
                      key={draft.id}
                      draft={draft}
                      onClick={() => onDraftClick(draft)}
                      onDelete={onDeleteDraft}
                    />
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

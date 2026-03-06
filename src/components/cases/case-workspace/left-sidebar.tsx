import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, FileText, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CaseSource, Draft, CaseSummary, Judgment } from '@/types'
import { SourceItem } from './source-item'
import { DraftItem } from './draft-item'

interface LeftSidebarProps {
  sources: CaseSource[]
  judgments: Judgment[]
  isJudgmentsLoading: boolean
  selectedSourceIds: Set<string>
  isSourcesLoading: boolean
  drafts: Draft[]
  summary: CaseSummary | null
  isSummaryLoading: boolean
  onToggleSourceSelection: (sourceId: string) => void
  onSelectAllSources: () => void
  onDeselectAllSources: () => void
  onDeleteSource: (sourceId: string) => Promise<void>
  onLinkContent: (sourceId: string) => Promise<void>
  onDraftClick: (draft: Draft) => void
  onDeleteDraft: (id: string) => void
  onSummaryClick: () => void
  onDeleteSummary: () => void
  onOpenSourceInTab: (source: CaseSource, url: string) => void
  onOpenJudgment: (judgment: Judgment) => void
  onDeleteJudgment?: (judgmentId: string) => void
}

export function LeftSidebar({
  sources,
  judgments,
  isJudgmentsLoading,
  selectedSourceIds,
  isSourcesLoading,
  drafts,
  summary,
  isSummaryLoading,
  onToggleSourceSelection,
  onSelectAllSources,
  onDeselectAllSources,
  onDeleteSource,
  onLinkContent,
  onDraftClick,
  onDeleteDraft,
  onSummaryClick,
  onDeleteSummary,
  onOpenSourceInTab,
  onOpenJudgment,
  onDeleteJudgment,
}: LeftSidebarProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [judgmentsExpanded, setJudgmentsExpanded] = useState(true)
  const [draftsExpanded, setDraftsExpanded] = useState(true)
  const [summaryExpanded, setSummaryExpanded] = useState(true)

  // Filter sources by type
  const uploadedSources = (sources || []).filter(s => s.type === 'USER_UPLOADED')

  const allSourcesSelected = uploadedSources.length > 0 && selectedSourceIds.size === uploadedSources.length

  return (
    <div className="flex flex-col h-full overflow-hidden bg-kx-card">
      <div className="flex-1 overflow-y-auto">
        {/* User Uploaded Section */}
        <div className="pb-2">
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
          >
            {sourcesExpanded ? (
              <ChevronDown className="h-4 w-4 text-ledger-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-ledger-gray-500" />
            )}
            <span className="text-sm font-semibold text-kx-primary-900">Sources</span>
            {uploadedSources.length > 0 && (
              <span className="text-xs text-ledger-gray-400 px-1.5">
                {uploadedSources.length}
              </span>
            )}
          </button>

          {sourcesExpanded && (
            <div>
              {isSourcesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                </div>
              ) : uploadedSources.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">No documents uploaded</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between px-4 py-1">
                    <button
                      className="text-xs text-ledger-gray-500 hover:text-kx-primary-700 transition-colors"
                      onClick={allSourcesSelected ? onDeselectAllSources : onSelectAllSources}
                    >
                      {allSourcesSelected ? 'Deselect all' : 'Select all'}
                    </button>
                    {selectedSourceIds.size > 0 && (
                      <span className="text-xs text-ledger-gray-400">{selectedSourceIds.size} selected</span>
                    )}
                  </div>
                  {uploadedSources.map((source) => (
                    <SourceItem
                      key={source.id}
                      source={source}
                      isSelected={selectedSourceIds.has(source.id)}
                      onToggleSelection={() => onToggleSourceSelection(source.id)}
                      onDelete={() => onDeleteSource(source.id)}
                      onLinkContent={() => onLinkContent(source.id)}
                      onOpenInTab={onOpenSourceInTab}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* Judgments Section */}
        <div className="pb-2">
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setJudgmentsExpanded(!judgmentsExpanded)}
          >
            {judgmentsExpanded ? (
              <ChevronDown className="h-4 w-4 text-ledger-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-ledger-gray-500" />
            )}
            <span className="text-sm font-semibold text-kx-primary-900">Judgments</span>
            {judgments.length > 0 && (
              <span className="text-xs text-ledger-gray-400 px-1.5">
                {judgments.length}
              </span>
            )}
          </button>

          {judgmentsExpanded && (
            <div>
              {isJudgmentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                </div>
              ) : judgments.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">No judgments linked</p>
                </div>
              ) : (
                <div>
                  {judgments.map((judgment) => (
                    <div
                      key={judgment.id}
                      className="group relative flex items-center gap-2 px-4 py-2.5 hover:bg-ledger-gray-50 transition-colors cursor-pointer"
                      onClick={() => onOpenJudgment(judgment)}
                    >
                      <FileText className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-kx-primary-900 truncate">{judgment.title}</p>
                        <p className="text-xs text-ledger-gray-500 truncate">{judgment.citation}</p>
                      </div>
                      {onDeleteJudgment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); onDeleteJudgment(judgment.id) }}
                          title="Remove judgment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
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

        {/* Divider */}
        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* Summary Section */}
        <div>
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setSummaryExpanded(!summaryExpanded)}
          >
            {summaryExpanded ? (
              <ChevronDown className="h-4 w-4 text-ledger-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-ledger-gray-500" />
            )}
            <span className="text-sm font-semibold text-kx-primary-900">Summary</span>
            {summary?.status === 'completed' && (
              <span className="text-xs text-ledger-gray-400 px-1.5">1</span>
            )}
          </button>

          {summaryExpanded && (
            <div className="pb-2">
              {isSummaryLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                </div>
              ) : !summary ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">No summary yet</p>
                </div>
              ) : summary.status === 'pending' ? (
                <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-ledger-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                  Generating...
                </div>
              ) : summary.status === 'failed' ? (
                <div
                  className="group relative flex items-center gap-2 px-4 py-2.5 hover:bg-ledger-gray-50 transition-colors cursor-pointer"
                  onClick={onSummaryClick}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-500 truncate flex-1 min-w-0">
                    Generation failed
                  </span>
                </div>
              ) : (
                <div className="group relative flex items-center gap-2 px-4 py-2.5 hover:bg-ledger-gray-50 transition-colors">
                  <button
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    onClick={onSummaryClick}
                  >
                    <FileText className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
                    <span className="text-sm text-kx-primary-900 truncate flex-1 min-w-0">
                      Case Summary
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); onDeleteSummary() }}
                    title="Delete summary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

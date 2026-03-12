import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, FileText, Trash2, AlertCircle, MoreVertical, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CaseDocument, Draft, CaseSummary } from '@/types'
import { SourceItem } from './source-item'
import { JudgmentItem } from './judgment-item'
import { DraftItem } from './draft-item'

interface LeftSidebarProps {
  sources: CaseDocument[]
  apiDraftDocuments: CaseDocument[]  // DRAFT type documents from API
  judgments: CaseDocument[]  // Now accepts CaseDocument with type 'JUDGMENT'
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
  onOpenSourceInTab: (source: CaseDocument, url: string) => void
  onOpenJudgmentInTab: (judgment: CaseDocument, url: string) => void
  onDeleteJudgment: (judgmentId: string) => Promise<void>
  onReindexJudgment: (judgmentId: string) => Promise<void>
  onRenameDocument: (documentId: string, newName: string) => Promise<void>
}

export function LeftSidebar({
  sources,
  apiDraftDocuments,
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
  onOpenJudgmentInTab,
  onDeleteJudgment,
  onReindexJudgment,
  onRenameDocument,
}: LeftSidebarProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [judgmentsExpanded, setJudgmentsExpanded] = useState(true)
  const [draftsExpanded, setDraftsExpanded] = useState(true)
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [showSummaryMenu, setShowSummaryMenu] = useState(false)

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
                      onRename={(newName) => onRenameDocument(source.id, newName)}
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
                    <JudgmentItem
                      key={judgment.id}
                      judgment={judgment}
                      onDelete={() => onDeleteJudgment(judgment.id)}
                      onLinkContent={() => onReindexJudgment(judgment.id)}
                      onOpenInTab={onOpenJudgmentInTab}
                      onRename={(newName) => onRenameDocument(judgment.id, newName)}
                    />
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
              {drafts.length === 0 && apiDraftDocuments.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">No drafts yet</p>
                </div>
              ) : (
                <div>
                  {/* Only show AI-generated drafts from useDrafts hook - these are the same as API DRAFT documents */}
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
                <div
                  className="group relative flex items-center gap-2 px-4 py-2.5 hover:bg-ledger-gray-50 transition-colors"
                  onMouseLeave={() => setShowSummaryMenu(false)}
                >
                  <button
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    onClick={onSummaryClick}
                  >
                    <FileText className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />
                    <span className="text-sm text-kx-primary-900 truncate flex-1 min-w-0">
                      Case Summary
                    </span>
                  </button>
                  <div className="relative flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-ledger-gray-400 hover:text-kx-primary-700 hover:bg-ledger-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setShowSummaryMenu(!showSummaryMenu) }}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>

                    {showSummaryMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-kx-card border border-kx-card-border rounded-lg shadow-md z-10">
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-primary-900 hover:bg-ledger-gray-50 transition-colors rounded-t-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (summary?.content) {
                              const blob = new Blob([summary.content], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              window.open(url, '_blank')
                            }
                            setShowSummaryMenu(false)
                          }}
                          disabled={!summary?.content}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in new tab
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors rounded-b-lg"
                          onClick={(e) => { e.stopPropagation(); onDeleteSummary(); setShowSummaryMenu(false) }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

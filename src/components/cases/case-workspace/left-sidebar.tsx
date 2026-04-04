import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown, ChevronRight, Loader2, FileText, Trash2, AlertCircle,
  MoreVertical, ExternalLink, FolderOpen, Scale, PenLine, BookOpen,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CaseDocument, Draft, CaseSummary } from '@/types'
import { cn } from '@/lib/utils'
import { SourceItem } from './source-item'
import { JudgmentItem } from './judgment-item'
import { DraftItem } from './draft-item'
import { SOURCE_PAGE_SIZE } from '@/hooks/use-case-sources'

type SourceFilter = 'all' | 'indexed' | 'processing' | 'failed'

function matchesFilter(doc: CaseDocument, filter: SourceFilter): boolean {
  if (filter === 'all') return true
  const s = (doc.indexingStatus ?? '').toLowerCase()
  if (filter === 'indexed') return s === 'indexing_completed'
  if (filter === 'processing') return s === 'indexing_pending' || s === 'indexing_running'
  if (filter === 'failed') return s === 'indexing_failed'
  return true
}

interface LeftSidebarProps {
  sources: CaseDocument[]
  sourcePage: number
  sourceTotal: number
  onSourcePageChange: (page: number) => void
  apiDraftDocuments: CaseDocument[]
  judgments: CaseDocument[]
  isJudgmentsLoading: boolean
  selectedSourceIds: Set<string>
  isSourcesLoading: boolean
  drafts: Draft[]
  summary: CaseSummary | null
  isSummaryLoading: boolean
  onToggleSourceSelection: (sourceId: string) => void
  onSelectAllSources: (ids: string[]) => void
  onDeselectAllSources: () => void
  onBatchDelete: (ids: string[]) => Promise<void>
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
  onRenameDraft: (draftId: string, newTitle: string) => Promise<void>
  onEditInBrowser: (source: CaseDocument) => void
}

export function LeftSidebar({
  sources,
  sourcePage,
  sourceTotal,
  onSourcePageChange,
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
  onBatchDelete,
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
  onRenameDraft,
  onEditInBrowser,
}: LeftSidebarProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [judgmentsExpanded, setJudgmentsExpanded] = useState(true)
  const [draftsExpanded, setDraftsExpanded] = useState(true)
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [showSummaryMenu, setShowSummaryMenu] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  const filteredSources = sources.filter((s) => matchesFilter(s, sourceFilter))
  const filteredIds = filteredSources.map((s) => s.id)
  const selectedFilteredIds = filteredIds.filter((id) => selectedSourceIds.has(id))
  const allFilteredSelected = filteredIds.length > 0 && selectedFilteredIds.length === filteredIds.length
  const someFilteredSelected = selectedFilteredIds.length > 0 && !allFilteredSelected

  const totalPages = Math.max(1, Math.ceil(sourceTotal / SOURCE_PAGE_SIZE))

  const handleSelectAllToggle = () => {
    if (allFilteredSelected) {
      // deselect only the filtered items on this page
      onDeselectAllSources()
    } else {
      onSelectAllSources(filteredIds)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedFilteredIds.length === 0) return
    setIsBatchDeleting(true)
    try {
      await onBatchDelete(selectedFilteredIds)
    } finally {
      setIsBatchDeleting(false)
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      setCanScrollUp(el.scrollTop > 4)
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', check); ro.disconnect() }
  }, [sources, judgments, drafts, summary])

  // Reset filter when page changes
  useEffect(() => { setSourceFilter('all') }, [sourcePage])

  const filterOptions: { value: SourceFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'indexed', label: 'Indexed' },
    { value: 'processing', label: 'Processing' },
    { value: 'failed', label: 'Failed' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-kx-card relative">
      {/* Top fade */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-kx-card to-transparent z-10 pointer-events-none transition-opacity duration-200',
        canScrollUp ? 'opacity-100' : 'opacity-0'
      )} />
      {/* Bottom fade */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-kx-card to-transparent z-10 pointer-events-none transition-opacity duration-200',
        canScrollDown ? 'opacity-100' : 'opacity-0'
      )} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {/* ── Sources Section ── */}
        <div className="pb-1">
          {/* Section header */}
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
          >
            {sourcesExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-ledger-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-ledger-gray-400" />
            )}
            <FolderOpen className="h-4 w-4 text-kx-primary-500" />
            <span className="text-sm font-semibold text-kx-primary-900 flex-1 text-left">Sources</span>
            {sourceTotal > 0 && (
              <span className="text-[10px] font-medium bg-kx-primary-100 text-kx-primary-700 dark:bg-kx-primary-900/30 dark:text-kx-primary-400 rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {sourceTotal}
              </span>
            )}
          </button>

          {sourcesExpanded && (
            <div>
              {/* Filter chips */}
              {sources.length > 0 && (
                <div className="flex items-center gap-1 px-4 pb-2 flex-wrap">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSourceFilter(opt.value)}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                        sourceFilter === opt.value
                          ? 'bg-kx-primary-600 text-white border-kx-primary-600'
                          : 'bg-transparent text-ledger-gray-500 border-ledger-gray-200 hover:border-kx-primary-300 hover:text-kx-primary-700'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Select-all row + bulk-delete */}
              {filteredSources.length > 0 && (
                <div className="flex items-center gap-2 px-4 pb-1.5">
                  <label
                    className="flex items-center gap-1.5 cursor-pointer select-none flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={(el) => { if (el) el.indeterminate = someFilteredSelected }}
                      onChange={handleSelectAllToggle}
                      className="h-3.5 w-3.5 rounded border-ledger-gray-300 text-kx-primary-600 focus:ring-kx-primary-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-ledger-gray-500">
                      {selectedFilteredIds.length > 0
                        ? `${selectedFilteredIds.length} selected`
                        : 'Select all'}
                    </span>
                  </label>

                  {selectedFilteredIds.length > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      disabled={isBatchDeleting}
                      className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {isBatchDeleting
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3" />
                      }
                      Delete
                    </button>
                  )}
                </div>
              )}

              {/* Document list */}
              {isSourcesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                </div>
              ) : filteredSources.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-ledger-gray-500">
                    {sourceFilter !== 'all' ? 'No documents match this filter' : 'No documents uploaded'}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredSources.map((source) => (
                    <SourceItem
                      key={source.id}
                      source={source}
                      isSelected={selectedSourceIds.has(source.id)}
                      onToggleSelection={() => onToggleSourceSelection(source.id)}
                      onDelete={() => onDeleteSource(source.id)}
                      onLinkContent={() => onLinkContent(source.id)}
                      onOpenInTab={onOpenSourceInTab}
                      onRename={(newName) => onRenameDocument(source.id, newName)}
                      onEditInBrowser={onEditInBrowser}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-ledger-gray-100">
                  <button
                    onClick={() => onSourcePageChange(sourcePage - 1)}
                    disabled={sourcePage <= 1}
                    className="p-1 rounded hover:bg-ledger-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-ledger-gray-500" />
                  </button>
                  <span className="text-[11px] text-ledger-gray-500">
                    {sourcePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => onSourcePageChange(sourcePage + 1)}
                    disabled={sourcePage >= totalPages}
                    className="p-1 rounded hover:bg-ledger-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-3.5 w-3.5 text-ledger-gray-500" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* ── Judgments Section ── */}
        <div className="pb-2">
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setJudgmentsExpanded(!judgmentsExpanded)}
          >
            {judgmentsExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-ledger-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-ledger-gray-400" />
            )}
            <Scale className="h-4 w-4 text-kx-primary-500" />
            <span className="text-sm font-semibold text-kx-primary-900 flex-1 text-left">Judgments</span>
            {judgments.length > 0 && (
              <span className="text-[10px] font-medium bg-kx-primary-100 text-kx-primary-700 dark:bg-kx-primary-900/30 dark:text-kx-primary-400 rounded-full px-2 py-0.5 min-w-[20px] text-center">
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

        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* ── Drafts Section ── */}
        <div>
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setDraftsExpanded(!draftsExpanded)}
          >
            {draftsExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-ledger-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-ledger-gray-400" />
            )}
            <PenLine className="h-4 w-4 text-kx-primary-500" />
            <span className="text-sm font-semibold text-kx-primary-900 flex-1 text-left">Drafts</span>
            {drafts.length > 0 && (
              <span className="text-[10px] font-medium bg-kx-primary-100 text-kx-primary-700 dark:bg-kx-primary-900/30 dark:text-kx-primary-400 rounded-full px-2 py-0.5 min-w-[20px] text-center">
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
                  {drafts.map((draft) => (
                    <DraftItem
                      key={draft.id}
                      draft={draft}
                      onClick={() => onDraftClick(draft)}
                      onDelete={onDeleteDraft}
                      onRename={(newTitle) => onRenameDraft(draft.id, newTitle)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* ── Summary Section ── */}
        <div>
          <button
            className="flex items-center gap-2 px-4 py-3 w-full hover:bg-ledger-gray-50 transition-colors"
            onClick={() => setSummaryExpanded(!summaryExpanded)}
          >
            {summaryExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-ledger-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-ledger-gray-400" />
            )}
            <BookOpen className="h-4 w-4 text-kx-primary-500" />
            <span className="text-sm font-semibold text-kx-primary-900 flex-1 text-left">Summary</span>
            {summary?.status === 'completed' && (
              <span className="text-[10px] font-medium bg-kx-primary-100 text-kx-primary-700 dark:bg-kx-primary-900/30 dark:text-kx-primary-400 rounded-full px-2 py-0.5 min-w-[20px] text-center">1</span>
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
                  <span className="text-sm text-red-500 truncate flex-1 min-w-0">Generation failed</span>
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
                    <span className="text-sm text-kx-primary-900 truncate flex-1 min-w-0">Case Summary</span>
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
                              window.open(URL.createObjectURL(blob), '_blank')
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

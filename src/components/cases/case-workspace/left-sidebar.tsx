import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Loader2, FileText, Trash2, AlertCircle, MoreVertical, ExternalLink, FolderOpen, Scale, PenLine, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CaseDocument, Draft, CaseSummary } from '@/types'
import { cn } from '@/lib/utils'
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
}: LeftSidebarProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [judgmentsExpanded, setJudgmentsExpanded] = useState(true)
  const [draftsExpanded, setDraftsExpanded] = useState(true)
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [showSummaryMenu, setShowSummaryMenu] = useState(false)

  // Filter sources by type
  const uploadedSources = (sources || []).filter(s => s.type === 'USER_UPLOADED')

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-kx-card relative">
      {/* Top fade when scrolled down */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-kx-card to-transparent z-10 pointer-events-none transition-opacity duration-200',
        canScrollUp ? 'opacity-100' : 'opacity-0'
      )} />
      {/* Bottom fade when more content below */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-kx-card to-transparent z-10 pointer-events-none transition-opacity duration-200',
        canScrollDown ? 'opacity-100' : 'opacity-0'
      )} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {/* User Uploaded Section */}
        <div className="pb-2">
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
            {uploadedSources.length > 0 && (
              <span className="text-[10px] font-medium bg-kx-primary-100 text-kx-primary-700 dark:bg-kx-primary-900/30 dark:text-kx-primary-400 rounded-full px-2 py-0.5 min-w-[20px] text-center">
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

        {/* Divider */}
        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* Drafts Section */}
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
                  {/* Only show AI-generated drafts from useDrafts hook - these are the same as API DRAFT documents */}
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

        {/* Divider */}
        <div className="mx-4 border-t border-ledger-gray-200" />

        {/* Summary Section */}
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

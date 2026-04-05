import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Search, MoreVertical, FileText, File, Sparkles,
  ArrowLeft, Loader2, ExternalLink, Pencil, Trash2, Check, X,
  AlertCircle, ChevronDown, ChevronRight, PanelLeftClose,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { workspaceApi } from '@/services/api/workspace-api'
import { renderDraftToHtml } from '@/lib/draft-renderer'
import type { CaseDocument, Draft, CaseSummary } from '@/types'
import { toast } from '@/hooks/use-toast'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getFileExt(name: string): string {
  return name.split('.').pop()?.toUpperCase() || 'FILE'
}

function FileIconBadge({ name, isGenerated }: { name: string; isGenerated?: boolean }) {
  const ext = getFileExt(name)
  if (isGenerated) {
    return (
      <div className="flex-shrink-0 h-7 w-7 rounded-md bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center">
        <Sparkles className="h-3.5 w-3.5 text-kx-primary-600 dark:text-kx-primary-400" />
      </div>
    )
  }
  const isPdf = ext === 'PDF'
  const isDoc = ext === 'DOCX' || ext === 'DOC'
  return (
    <div className={cn(
      'flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center',
      isPdf ? 'bg-red-100 dark:bg-red-950/40' : isDoc ? 'bg-blue-100 dark:bg-blue-950/40' : 'bg-ledger-gray-100 dark:bg-ledger-gray-800'
    )}>
      <FileText className={cn('h-3.5 w-3.5', isPdf ? 'text-red-600' : isDoc ? 'text-blue-600' : 'text-ledger-gray-500')} />
    </div>
  )
}

function IndexingDot({ status }: { status?: string | null }) {
  const s = (status ?? '').toLowerCase()
  if (s === 'indexing_running' || s === 'indexing_pending') {
    return <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
  }
  if (s === 'indexing_failed') {
    return <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
  }
  return null
}

// ─── Three-dots menu ──────────────────────────────────────────────────────────

interface ItemMenuProps {
  onView?: () => void
  onOpenInNewTab: () => void
  onRename: () => void
  onDelete: () => void
}

function ItemMenu({ onView, onOpenInNewTab, onRename, onDelete }: ItemMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-700 bg-kx-card shadow-lg py-1">
          {onView && (
            <button type="button" onClick={() => { setOpen(false); onView() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-kx-text-primary hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800 transition-colors">
              <FileText className="h-3.5 w-3.5 text-ledger-gray-400" /> View
            </button>
          )}
          <button type="button" onClick={() => { setOpen(false); onOpenInNewTab() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-kx-text-primary hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800 transition-colors">
            <ExternalLink className="h-3.5 w-3.5 text-ledger-gray-400" /> Open in new tab
          </button>
          <button type="button" onClick={() => { setOpen(false); onRename() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-kx-text-primary hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800 transition-colors">
            <Pencil className="h-3.5 w-3.5 text-ledger-gray-400" /> Rename
          </button>
          <button type="button" onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Inline rename ────────────────────────────────────────────────────────────

function InlineRenameInput({
  defaultValue,
  onCommit,
  onCancel,
}: {
  defaultValue: string
  onCommit: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.select() }, [])

  const commit = () => {
    const v = value.trim()
    if (v && v !== defaultValue) onCommit(v)
    else onCancel()
  }

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel() }}
        onBlur={commit}
        className="flex-1 min-w-0 text-sm border border-kx-primary-400 rounded px-1.5 py-0.5 bg-white dark:bg-ledger-gray-800 text-kx-text-primary focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
        autoFocus
      />
      <button type="button" onMouseDown={e => { e.preventDefault(); commit() }}
        className="h-5 w-5 flex items-center justify-center rounded text-green-600 hover:bg-green-50">
        <Check className="h-3 w-3" />
      </button>
      <button type="button" onMouseDown={e => { e.preventDefault(); onCancel() }}
        className="h-5 w-5 flex items-center justify-center rounded text-ledger-gray-400 hover:bg-ledger-gray-100">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Document inline viewer ───────────────────────────────────────────────────

type ViewItem =
  | { kind: 'source'; doc: CaseDocument }
  | { kind: 'draft'; draft: Draft }
  | { kind: 'summary'; summary: CaseSummary }

interface DocumentViewerProps {
  item: ViewItem
  onBack: () => void
}

function DocumentViewer({ item, onBack }: DocumentViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textHtml, setTextHtml] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setBlobUrl(null)
    setTextHtml(null)
    setIsLoading(true)

    async function load() {
      try {
        if (item.kind === 'draft') {
          const html = renderDraftToHtml(
            item.draft.content,
            item.draft.sections?.length ? item.draft.sections : undefined,
            item.draft.templateType,
            item.draft.contentFormat,
          )
          if (!cancelled) { setTextHtml(html); setIsLoading(false) }
          return
        }
        if (item.kind === 'summary') {
          const html = renderDraftToHtml(item.summary.content)
          if (!cancelled) { setTextHtml(html); setIsLoading(false) }
          return
        }
        // source
        const doc = item.doc
        const ext = getFileExt(doc.name)
        if (['PDF', 'JPG', 'JPEG', 'PNG'].includes(ext)) {
          const url = await workspaceApi.resolveDocumentUrl({
            id: doc.id,
            downloadUrl: doc.downloadUrl ?? undefined,
            signedUrl: doc.signedUrl ?? undefined,
          })
          if (!cancelled) { setBlobUrl(url); setIsLoading(false) }
        } else {
          // DOCX / DOC — no inline preview
          if (!cancelled) setIsLoading(false)
        }
      } catch {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [item])

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [blobUrl])

  const name = item.kind === 'source' ? (item.doc.originalFilename || item.doc.name)
    : item.kind === 'draft' ? item.draft.title
    : 'Case Summary'

  const ext = item.kind === 'source' ? getFileExt(item.doc.name) : null

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Viewer header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-kx-card-border flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors flex-shrink-0"
          title="Back to sources"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-kx-text-primary truncate leading-none">{name}</p>
          {ext && <p className="text-[10px] text-ledger-gray-400 mt-0.5">{ext}</p>}
        </div>
        {item.kind === 'source' && (item.doc.downloadUrl || item.doc.signedUrl) && (
          <a
            href={item.doc.downloadUrl ?? item.doc.signedUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors flex-shrink-0"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Viewer content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-ledger-gray-400" />
          </div>
        ) : textHtml ? (
          <div className="p-4 text-sm leading-relaxed text-kx-text-primary" dangerouslySetInnerHTML={{ __html: textHtml }} />
        ) : blobUrl && ext === 'PDF' ? (
          <iframe src={blobUrl} className="w-full h-full border-0" title={name} />
        ) : blobUrl && (ext === 'JPG' || ext === 'JPEG' || ext === 'PNG') ? (
          <div className="flex items-center justify-center p-4 h-full">
            <img src={blobUrl} alt={name} className="max-w-full max-h-full object-contain rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
            <File className="h-8 w-8 text-ledger-gray-300" />
            <p className="text-sm font-medium text-kx-text-primary">Preview not available</p>
            <p className="text-xs text-ledger-gray-400">Open in a new tab to view this file</p>
            {item.kind === 'source' && (item.doc.downloadUrl || item.doc.signedUrl) && (
              <a
                href={item.doc.downloadUrl ?? item.doc.signedUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-kx-primary-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Open file
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WorkspaceSourcesPanelProps {
  sources: CaseDocument[]
  isSourcesLoading: boolean
  drafts: Draft[]
  summary: CaseSummary | null
  selectedSourceIds: Set<string>
  onAddSource: () => void
  onDeleteSource: (id: string) => Promise<void>
  onRenameDocument: (id: string, name: string) => Promise<void>
  onDeleteDraft: (id: string) => void
  onRenameDraft: (id: string, title: string) => Promise<void>
  onToggleSource: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: () => void
  onClose: () => void
}

export function WorkspaceSourcesPanel({
  sources,
  isSourcesLoading,
  drafts,
  summary,
  selectedSourceIds,
  onAddSource,
  onDeleteSource,
  onRenameDocument,
  onDeleteDraft,
  onRenameDraft,
  onToggleSource,
  onSelectAll,
  onDeselectAll,
  onClose,
}: WorkspaceSourcesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [generatedExpanded, setGeneratedExpanded] = useState(true)
  const [viewingItem, setViewingItem] = useState<ViewItem | null>(null)

  const query = searchQuery.trim().toLowerCase()

  const filteredSources = sources.filter(s =>
    !query || (s.originalFilename || s.name).toLowerCase().includes(query)
  )
  const filteredDrafts = drafts.filter(d =>
    !query || d.title.toLowerCase().includes(query)
  )
  const showSummary = !query || 'summary'.includes(query) || 'case summary'.includes(query)

  const generatedCount = drafts.length + (summary ? 1 : 0)

  const handleOpenSourceInNewTab = useCallback(async (doc: CaseDocument) => {
    try {
      const url = await workspaceApi.resolveDocumentUrl({
        id: doc.id,
        downloadUrl: doc.downloadUrl ?? undefined,
        signedUrl: doc.signedUrl ?? undefined,
      })
      window.open(url, '_blank', 'noreferrer')
    } catch {
      toast({ title: 'Could not open file', variant: 'destructive' })
    }
  }, [])

  const handleOpenDraftInNewTab = useCallback((draft: Draft) => {
    // Navigate to drafts page or open download URL
    window.open(`/drafts/${draft.id}`, '_blank', 'noreferrer')
  }, [])

  // If viewing a document inline, show the viewer
  if (viewingItem) {
    return <DocumentViewer item={viewingItem} onBack={() => setViewingItem(null)} />
  }

  const allVisibleSelected = filteredSources.length > 0 && filteredSources.every(s => selectedSourceIds.has(s.id))
  const someSelected = filteredSources.some(s => selectedSourceIds.has(s.id))

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-kx-card-border flex-shrink-0">
        <span className="text-sm font-semibold text-kx-text-primary">Sources</span>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors"
          title="Hide sources panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Top actions */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0 space-y-2">
        <button
          type="button"
          onClick={onAddSource}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-kx-card-border text-sm font-medium text-kx-text-primary hover:border-kx-primary-400 hover:text-kx-primary-600 hover:bg-kx-primary-50/50 dark:hover:bg-kx-primary-950/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Source
        </button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ledger-gray-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter sources..."
            className="w-full h-7 pl-8 pr-3 text-xs bg-ledger-gray-50 dark:bg-ledger-gray-800/60 border border-ledger-gray-200 dark:border-ledger-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-kx-primary-400 text-kx-text-primary placeholder:text-ledger-gray-400"
          />
        </div>
        {/* Select all sources row */}
        {sources.length > 0 && (
          <button
            type="button"
            onClick={() => allVisibleSelected ? onDeselectAll() : onSelectAll(filteredSources.map(s => s.id))}
            className="flex items-center justify-between w-full px-1 py-1 rounded hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/50 transition-colors"
          >
            <span className="text-xs text-ledger-gray-600 dark:text-ledger-gray-400">Select all sources</span>
            <div className={cn(
              'h-4 w-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors',
              allVisibleSelected
                ? 'bg-kx-primary-600 border-kx-primary-600'
                : someSelected
                  ? 'bg-kx-primary-200 border-kx-primary-400'
                  : 'border-ledger-gray-300 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800'
            )}>
              {(allVisibleSelected || someSelected) && <Check className="h-2.5 w-2.5 text-white" />}
            </div>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* SOURCES section */}
        <div>
          <button
            type="button"
            onClick={() => setSourcesExpanded(v => !v)}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-semibold tracking-widest text-ledger-gray-400 uppercase hover:text-ledger-gray-500 transition-colors"
          >
            {sourcesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Uploaded ({sources.length})
          </button>

          {sourcesExpanded && (
            <>
              {isSourcesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                </div>
              ) : filteredSources.length === 0 ? (
                <p className="px-4 py-3 text-xs text-ledger-gray-400 italic">
                  {sources.length === 0 ? 'No sources yet. Add a document to get started.' : 'No matching sources.'}
                </p>
              ) : (
                <div className="px-2 pb-1 space-y-0.5">
                  {filteredSources.map(doc => {
                    const name = doc.originalFilename || doc.name
                    const isRenaming = renamingId === doc.id
                    return (
                      <div
                        key={doc.id}
                        onClick={() => !isRenaming && setViewingItem({ kind: 'source', doc })}
                        className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/50 cursor-pointer transition-colors"
                      >
                        <FileIconBadge name={name} />
                        <div className="flex-1 min-w-0">
                          {isRenaming ? (
                            <InlineRenameInput
                              defaultValue={name}
                              onCommit={async v => {
                                setRenamingId(null)
                                await onRenameDocument(doc.id, v)
                              }}
                              onCancel={() => setRenamingId(null)}
                            />
                          ) : (
                            <>
                              <p className="text-xs font-medium text-kx-text-primary truncate leading-snug">
                                {name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-ledger-gray-400 font-medium">
                                  {getFileExt(name)}
                                </span>
                                <IndexingDot status={doc.indexingStatus} />
                                <span className="text-[10px] text-ledger-gray-400">
                                  {doc.createdAt ? formatRelativeTime(doc.createdAt) : ''}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {!isRenaming && (
                          <>
                            <ItemMenu
                              onView={() => setViewingItem({ kind: 'source', doc })}
                              onOpenInNewTab={() => handleOpenSourceInNewTab(doc)}
                              onRename={() => setRenamingId(doc.id)}
                              onDelete={async () => {
                                await onDeleteSource(doc.id)
                              }}
                            />
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); onToggleSource(doc.id) }}
                              className="flex-shrink-0"
                              title={selectedSourceIds.has(doc.id) ? 'Remove from context' : 'Add to context'}
                            >
                              <div className={cn(
                                'h-4 w-4 rounded flex items-center justify-center border transition-colors',
                                selectedSourceIds.has(doc.id)
                                  ? 'bg-kx-primary-600 border-kx-primary-600'
                                  : 'border-ledger-gray-300 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800'
                              )}>
                                {selectedSourceIds.has(doc.id) && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* GENERATED section */}
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setGeneratedExpanded(v => !v)}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-semibold tracking-widest text-ledger-gray-400 uppercase hover:text-ledger-gray-500 transition-colors"
          >
            {generatedExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Generated ({generatedCount})
          </button>

          {generatedExpanded && (
            <div className="px-2 pb-2 space-y-0.5">
              {/* Summary */}
              {summary && showSummary && (
                <div
                  onClick={() => setViewingItem({ kind: 'summary', summary })}
                  className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/50 cursor-pointer transition-colors"
                >
                  <FileIconBadge name="summary.pdf" isGenerated />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-kx-text-primary truncate leading-snug">Case Summary</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {summary.status === 'pending' && (
                        <span className="flex items-center gap-1 text-[10px] text-kx-primary-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-kx-primary-500 animate-pulse" />
                          Generating…
                        </span>
                      )}
                      {summary.status === 'failed' && (
                        <span className="text-[10px] text-red-500">Failed</span>
                      )}
                      {summary.status === 'completed' && (
                        <span className="text-[10px] text-ledger-gray-400">
                          {formatRelativeTime(summary.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ItemMenu
                    onOpenInNewTab={() => {}}
                    onRename={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              )}

              {/* Drafts */}
              {filteredDrafts.map(draft => {
                const isRenaming = renamingId === `draft-${draft.id}`
                return (
                  <div
                    key={draft.id}
                    onClick={() => !isRenaming && draft.status === 'completed' && setViewingItem({ kind: 'draft', draft })}
                    className={cn(
                      'group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors',
                      draft.status === 'completed' ? 'hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/50 cursor-pointer' : 'cursor-default'
                    )}
                  >
                    <FileIconBadge name={`${draft.title}.docx`} isGenerated />
                    <div className="flex-1 min-w-0">
                      {isRenaming ? (
                        <InlineRenameInput
                          defaultValue={draft.title}
                          onCommit={async v => {
                            setRenamingId(null)
                            await onRenameDraft(draft.id, v)
                          }}
                          onCancel={() => setRenamingId(null)}
                        />
                      ) : (
                        <>
                          <p className="text-xs font-medium text-kx-text-primary truncate leading-snug">
                            {draft.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {draft.status === 'pending' && (
                              <span className="flex items-center gap-1 text-[10px] text-kx-primary-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-kx-primary-500 animate-pulse" />
                                Generating…
                              </span>
                            )}
                            {draft.status === 'failed' && (
                              <span className="text-[10px] text-red-500">Failed</span>
                            )}
                            {draft.status === 'completed' && (
                              <span className="text-[10px] text-ledger-gray-400">
                                {formatRelativeTime(draft.createdAt)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {!isRenaming && (
                      <ItemMenu
                        onView={draft.status === 'completed' ? () => setViewingItem({ kind: 'draft', draft }) : undefined}
                        onOpenInNewTab={() => handleOpenDraftInNewTab(draft)}
                        onRename={() => setRenamingId(`draft-${draft.id}`)}
                        onDelete={() => onDeleteDraft(draft.id)}
                      />
                    )}
                  </div>
                )
              })}

              {generatedCount === 0 && (
                <p className="px-2 py-3 text-xs text-ledger-gray-400 italic">
                  No generated documents yet. Use Case Studio to create one.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

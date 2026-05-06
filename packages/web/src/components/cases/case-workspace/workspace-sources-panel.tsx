import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Search, MoreVertical, FileText,
  Loader2, ExternalLink, Pencil, Trash2, Check, X,
  AlertCircle, PanelLeft, Sparkles, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { CaseDocument } from '@knowlex/core/types'
import { toast } from '@/hooks/use-toast'

function getFileExt(name: string, fileType?: string | null): string {
  if (fileType) return fileType.toUpperCase()
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return 'FILE'
  const ext = name.slice(dot + 1)
  // Sanity guard: real extensions are short. If the "ext" is long, treat as no extension.
  if (ext.length > 6) return 'FILE'
  return ext.toUpperCase()
}

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

function FileIconBadge({ name, fileType }: { name: string; fileType?: string | null }) {
  const ext = getFileExt(name, fileType)
  const isPdf = ext === 'PDF'
  const isDoc = ext === 'DOCX' || ext === 'DOC'
  return (
    <div className={cn(
      'flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center',
      isPdf ? 'bg-red-100 dark:bg-red-950/40' : isDoc ? 'bg-blue-100 dark:bg-blue-950/40' : 'bg-ledger-gray-100'
    )}>
      <FileText className={cn('h-3.5 w-3.5', isPdf ? 'text-red-600' : isDoc ? 'text-blue-600' : 'text-ledger-gray-500')} />
    </div>
  )
}

/** Always-visible indexing line under the filename (⋯ menu also shows status). */
function IndexingStatusInline({ status }: { status?: string | null }) {
  const s = (status ?? '').toUpperCase()
  if (s === 'INDEXING_RUNNING') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden />
        Indexing…
      </span>
    )
  }
  if (s === 'INDEXING_PENDING') {
    return <span className="text-[10px] font-medium text-ledger-gray-500">Pending</span>
  }
  if (s === 'INDEXING_COMPLETED') {
    return <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Indexed</span>
  }
  if (s === 'INDEXING_FAILED') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
        Failed
      </span>
    )
  }
  return <span className="text-[10px] font-medium text-ledger-gray-500">Pending</span>
}

// ─── Three-dots menu ──────────────────────────────────────────────────────────

function statusLabel(indexingStatus?: string | null): { label: string; color: string } | null {
  const s = (indexingStatus ?? '').toUpperCase()
  if (s === 'INDEXING_RUNNING')   return { label: 'Indexing', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' }
  if (s === 'INDEXING_PENDING')   return { label: 'Pending', color: 'text-ledger-gray-500 bg-ledger-gray-100 dark:bg-ledger-gray-800' }
  if (s === 'INDEXING_COMPLETED') return { label: 'Indexed', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' }
  if (s === 'INDEXING_FAILED')    return { label: 'Index Failed', color: 'text-red-600 bg-red-50 dark:bg-red-950/30' }
  return null
}

/** Reindex is only offered after a failed index; not while pending/running or when already indexed. */
function showReindexInMenu(indexingStatus?: string | null): boolean {
  return (indexingStatus ?? '').toUpperCase() === 'INDEXING_FAILED'
}

interface ItemMenuProps {
  indexingStatus?: string | null
  onOpenInNewTab: () => void
  onRename: () => void
  onReindex: () => void
  onDelete: () => void
}

function ItemMenu({ indexingStatus, onOpenInNewTab, onRename, onReindex, onDelete }: ItemMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.right - 160 })
    }
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); handleToggle() }}
        className="h-6 w-6 flex items-center justify-center rounded-md text-ledger-gray-500 hover:text-kx-text-primary hover:bg-ledger-gray-200 transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-44 rounded-lg border border-nb-panel-border bg-nb-panel shadow-lg py-1"
          style={{ top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          {statusLabel(indexingStatus) && (() => {
            const { label, color } = statusLabel(indexingStatus)!
            return (
              <div className="px-3 py-2 border-b border-nb-panel-border">
                <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide', color)}>
                  {label}
                </span>
              </div>
            )
          })()}
          <button type="button" onClick={() => { setOpen(false); onOpenInNewTab() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ledger-gray-900 hover:bg-nb-sidebar-hover transition-colors">
            <ExternalLink className="h-3.5 w-3.5 text-ledger-gray-400" /> Open in new tab
          </button>
          <button type="button" onClick={() => { setOpen(false); onRename() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ledger-gray-900 hover:bg-nb-sidebar-hover transition-colors">
            <Pencil className="h-3.5 w-3.5 text-ledger-gray-400" /> Rename
          </button>
          {showReindexInMenu(indexingStatus) ? (
            <button type="button" onClick={() => { setOpen(false); onReindex() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ledger-gray-900 hover:bg-nb-sidebar-hover transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-ledger-gray-400" /> Reindex
            </button>
          ) : null}
          <button type="button" onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </>
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
        className="flex-1 min-w-0 text-sm border border-kx-primary-400 rounded px-1.5 py-0.5 bg-nb-input text-kx-text-primary focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
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

// ─── Main component ───────────────────────────────────────────────────────────

interface WorkspaceSourcesPanelProps {
  sources: CaseDocument[]
  isSourcesLoading: boolean
  selectedSourceIds: Set<string>
  caseId: string
  onAddSource: () => void
  onDeleteSource: (id: string) => Promise<void>
  onRenameDocument: (id: string, name: string) => Promise<void>
  onToggleSource: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: () => void
  onClose: () => void
  onDoubleClickDocument?: (doc: CaseDocument) => void
  webSearch?: boolean
  onWebSearchToggle?: (v: boolean) => void
}

export function WorkspaceSourcesPanel({
  sources,
  isSourcesLoading,
  selectedSourceIds,
  caseId,
  onAddSource,
  onDeleteSource,
  onRenameDocument,
  onToggleSource,
  onSelectAll,
  onDeselectAll,
  onClose,
  onDoubleClickDocument,
  webSearch = false,
  onWebSearchToggle,
}: WorkspaceSourcesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)

  const query = searchQuery.trim().toLowerCase()
  const filteredSources = sources.filter(s =>
    !query || (s.originalFilename || s.name).toLowerCase().includes(query)
  )

  const handleOpenInNewTab = useCallback(async (doc: CaseDocument) => {
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

  const allVisibleSelected = filteredSources.length > 0 && filteredSources.every(s => selectedSourceIds.has(s.id))
  const someSelected = filteredSources.some(s => selectedSourceIds.has(s.id))

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-nb-panel-border flex-shrink-0">
        <span className="text-base font-bold text-kx-text-primary">Sources</span>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-nb-text-muted hover:text-kx-text-primary hover:bg-nb-sidebar-hover transition-colors"
          title="Hide sources panel"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Web Search toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-nb-panel-border flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-ledger-gray-400" />
          <span className="text-xs font-medium text-kx-text-secondary">Web Search</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={webSearch}
          onClick={() => onWebSearchToggle?.(!webSearch)}
          className={cn(
            'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
            webSearch ? 'bg-kx-primary-600' : 'bg-ledger-gray-300 dark:bg-ledger-gray-600'
          )}
        >
          <span className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200',
            webSearch ? 'translate-x-4' : 'translate-x-0'
          )} />
        </button>
      </div>

      {/* Top actions */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0 space-y-2">
        <button
          type="button"
          onClick={onAddSource}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-nb-input-border text-sm font-semibold text-kx-text-primary hover:border-kx-primary-400 hover:text-kx-primary-600 hover:bg-kx-primary-50/50 dark:hover:bg-kx-primary-950/20 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Source
        </button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nb-text-muted pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter sources..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-nb-input border border-nb-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-kx-primary-200 focus:border-kx-primary-400 text-kx-text-primary placeholder:text-nb-text-muted transition-all"
          />
        </div>
        {/* Select all row */}
        {sources.length > 0 && (
          <button
            type="button"
            onClick={() => allVisibleSelected ? onDeselectAll() : onSelectAll(filteredSources.map(s => s.id))}
            className="flex items-center justify-between w-full px-1 py-1 rounded-lg hover:bg-nb-sidebar-hover transition-colors"
          >
            <span className="text-xs text-nb-text-muted font-medium">Select all sources</span>
            <div className={cn(
              'h-4 w-4 rounded-sm flex items-center justify-center border transition-colors',
              allVisibleSelected
                ? 'bg-kx-primary-600 border-kx-primary-600'
                : someSelected
                  ? 'bg-kx-primary-200 border-kx-primary-400'
                  : 'border-nb-input-border bg-nb-input'
            )}>
              {(allVisibleSelected || someSelected) && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>
        )}
      </div>

      {/* Sources list */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
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
                  className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-kx-primary-50 dark:hover:bg-kx-primary-950/20 cursor-pointer transition-colors"
                  onClick={() => { if (!isRenaming) onDoubleClickDocument?.(doc) }}
                >
                  <FileIconBadge name={name} fileType={doc.fileType} />
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
                        <p className="text-xs font-medium text-ledger-gray-900 truncate leading-snug">
                          {name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap min-w-0">
                          <span className="text-[10px] text-ledger-gray-500 font-medium shrink-0">
                            {getFileExt(name, doc.fileType)}
                          </span>
                          <span className="text-[10px] text-ledger-gray-400 shrink-0" aria-hidden>·</span>
                          <IndexingStatusInline status={doc.indexingStatus} />
                          {doc.createdAt ? (
                            <>
                              <span className="text-[10px] text-ledger-gray-400 shrink-0" aria-hidden>·</span>
                              <span className="text-[10px] text-ledger-gray-500 shrink-0">
                                {formatRelativeTime(doc.createdAt)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                  {!isRenaming && (
                    <>
                      <ItemMenu
                        indexingStatus={doc.indexingStatus}
                        onOpenInNewTab={() => handleOpenInNewTab(doc)}
                        onRename={() => setRenamingId(doc.id)}
                        onReindex={async () => {
                          try {
                            await workspaceApi.triggerIndexing(caseId, doc.id)
                            toast({ title: 'Reindexing started' })
                          } catch {
                            toast({ title: 'Failed to reindex', variant: 'destructive' })
                          }
                        }}
                        onDelete={async () => { await onDeleteSource(doc.id) }}
                      />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onToggleSource(doc.id) }}
                        className="flex-shrink-0"
                        title={selectedSourceIds.has(doc.id) ? 'Remove from context' : 'Add to context'}
                      >
                        <div className={cn(
                          'h-4 w-4 rounded-sm flex items-center justify-center border transition-colors',
                          selectedSourceIds.has(doc.id)
                            ? 'bg-kx-primary-600 border-kx-primary-600'
                            : 'border-ledger-gray-300 bg-nb-input'
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
      </div>
    </div>
  )
}

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  PanelRight, FileText, Gavel, Search,
  Lock, MoreVertical, Trash2, Pencil, Check, X, Loader2,
  AlertCircle, ExternalLink, BookOpen, Download, SquarePen,
  PenLine, Languages, FileDown,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { renderDraftToHtml, buildExportBodyHtml } from '@/lib/draft-renderer'
import { exportGeneratedDocument } from '@knowlex/core/api/doc-processing-api'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { Draft, CaseSummary, CaseSynopsis, CasePrecedent } from '@knowlex/core/types'
import { DocumentType } from '@knowlex/core/types'
import { useToast } from '@/hooks/use-toast'

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
        className="flex-1 min-w-0 text-xs border border-kx-primary-400 rounded px-1.5 py-0.5 bg-nb-input text-kx-text-primary focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
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

// ─── Draft/Summary item menu ──────────────────────────────────────────────────

function GeneratedItemMenu({ onRename, onDownloadPdf, onDownloadDoc, onDelete }: {
  onRename?: () => void
  onDownloadPdf?: () => void
  onDownloadDoc?: () => void
  onDelete: () => void
}) {
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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.right - 156 })
    }
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="h-6 w-6 flex items-center justify-center rounded-md text-ledger-gray-500 hover:text-kx-text-primary hover:bg-ledger-gray-200 transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-40 rounded-lg border border-nb-panel-border bg-nb-panel shadow-lg py-1"
          style={{ top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          {onRename && (
            <button type="button" onClick={() => { setOpen(false); onRename() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-ledger-gray-900 hover:bg-nb-sidebar-hover transition-colors">
              <Pencil className="h-3.5 w-3.5 text-ledger-gray-400" /> Rename
            </button>
          )}
          {onDownloadPdf && (
            <button type="button" onClick={() => { setOpen(false); onDownloadPdf() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-ledger-gray-900 hover:bg-nb-sidebar-hover transition-colors">
              <Download className="h-3.5 w-3.5 text-ledger-gray-400" /> Download PDF
            </button>
          )}
          {onDownloadDoc && (
            <button type="button" onClick={() => { setOpen(false); onDownloadDoc() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-ledger-gray-900 hover:bg-nb-sidebar-hover transition-colors">
              <FileDown className="h-3.5 w-3.5 text-ledger-gray-400" /> Download DOCX
            </button>
          )}
          {(onRename || onDownloadPdf || onDownloadDoc) && (
            <div className="my-1 h-px bg-ledger-gray-100 dark:bg-ledger-gray-700" />
          )}
          <button type="button" onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </>
  )
}

// ─── Document preview dialog ──────────────────────────────────────────────────

function DocumentPreviewDialog({
  open,
  onClose,
  title,
  htmlContent,
  onDownloadPdf,
  onDownloadDoc,
  onEdit,
}: {
  open: boolean
  onClose: () => void
  title: string
  htmlContent: string
  onDownloadPdf?: () => void
  onDownloadDoc?: () => void
  onEdit?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-5 py-3 border-b border-ledger-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 pr-8">
            <DialogTitle className="text-sm font-semibold truncate flex-1 min-w-0">{title}</DialogTitle>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onDownloadPdf && (
                <button type="button" onClick={onDownloadPdf}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ledger-gray-600 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 border border-ledger-gray-200 dark:border-ledger-gray-600 transition-colors">
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </button>
              )}
              {onDownloadDoc && (
                <button type="button" onClick={onDownloadDoc}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ledger-gray-600 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 border border-ledger-gray-200 dark:border-ledger-gray-600 transition-colors">
                  <FileDown className="h-3.5 w-3.5" />
                  DOCX
                </button>
              )}
              {onEdit && (
                <button type="button" onClick={onEdit}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-kx-primary-600 hover:bg-kx-primary-50 dark:hover:bg-kx-primary-950/20 border border-kx-primary-200 hover:border-kx-primary-400 transition-colors">
                  <SquarePen className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div
            className="text-sm leading-relaxed text-kx-text-primary legal-document"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tool card (vertical layout — icon top, title below) ─────────────────────

interface ToolCardProps {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  title: string
  locked?: boolean
  onClick?: () => void
}

function ToolCard({ icon: Icon, iconColor, iconBg, title, locked, onClick }: ToolCardProps) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={cn(
        'flex flex-col items-start gap-2 px-3 py-3 rounded-xl border text-left transition-all w-full',
        locked
          ? 'border-nb-panel-border bg-nb-sidebar opacity-40 cursor-not-allowed'
          : 'border-kx-primary-200 bg-nb-sidebar hover:border-kx-primary-400 hover:bg-nb-sidebar-hover cursor-pointer group'
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        {locked && <Lock className="h-3 w-3 text-nb-text-muted" />}
      </div>
      <span className={cn(
        'text-xs font-semibold leading-tight',
        locked ? 'text-nb-text-muted' : 'text-kx-text-primary group-hover:text-kx-primary-700'
      )}>
        {title}
      </span>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CaseStudioPanelProps {
  onClose: () => void
  onGenerateSummary: (webSearch?: boolean) => void
  onGenerateSynopsis: (webSearch?: boolean) => void
  onGeneratePrecedent: () => void
  webSearch?: boolean
  onSendToChat: (message: string) => void
  onFindPrecedents: () => void
  sourceCount: number
  caseId: string
  drafts: Draft[]
  summaries: CaseSummary[]
  synopses: CaseSynopsis[]
  precedent: CasePrecedent | null
  onDeleteDraft: (id: string) => void
  onRenameDraft: (id: string, title: string) => Promise<void>
  fetchDraftContent?: (id: string) => Promise<Draft | undefined>
  onDeleteSummary?: (documentId: string) => void | Promise<void>
  onDeleteSynopsis: (documentId?: string) => void | Promise<void>
  onDeletePrecedent: () => void
  onRenameSummary?: (documentId: string, name: string) => Promise<void>
  onRenameSynopsis?: (documentId: string, name: string) => Promise<void>
  onRenamePrecedent?: (name: string) => Promise<void>
  onStartDraft?: () => void
  onStartTranslation?: () => void
}

export function CaseStudioPanel({
  onClose,
  onGenerateSummary,
  onGenerateSynopsis,
  onGeneratePrecedent,
  drafts,
  summaries,
  synopses,
  precedent,
  onDeleteDraft,
  onRenameDraft,
  fetchDraftContent,
  onDeleteSummary,
  onDeleteSynopsis,
  onDeletePrecedent,
  onRenameSummary,
  onRenameSynopsis,
  onRenamePrecedent,
  webSearch,
  onStartDraft,
  onStartTranslation,
}: CaseStudioPanelProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{ id?: string; title: string; html: string; editUrl?: string } | null>(null)
  const [precedentDisplayName, setPrecedentDisplayName] = useState('Precedent Analysis')

  const summaryLabel = (s: CaseSummary) => s.title?.trim() || 'Case Summary'
  const synopsisLabel = (y: CaseSynopsis) => y.title?.trim() || 'Case Synopsis'

  const handleOpenSummary = async (s: CaseSummary) => {
    if (!s || s.status !== 'completed') return
    let content = s.content
    if (!content) {
      try {
        content = await workspaceApi.fetchDocumentContent({ id: s.id })
      } catch { /* keep empty fallback */ }
    }
    const html = renderDraftToHtml(content || 'Preview unavailable for this document.')
    setPreviewDoc({
      id: s.id,
      title: summaryLabel(s),
      html,
      editUrl: s.id && s.id !== 'pending' ? `/documents?open=${s.id}&edit=true` : undefined,
    })
  }

  const handleSummaryClick = () => {
    onGenerateSummary(webSearch)
  }

  const handleOpenSynopsis = async (y: CaseSynopsis) => {
    if (!y || y.status !== 'completed') return
    let content = y.content
    if (!content) {
      try {
        content = await workspaceApi.fetchDocumentContent({ id: y.id })
      } catch { /* keep empty fallback */ }
    }
    const html = renderDraftToHtml(content || 'Preview unavailable for this document.')
    setPreviewDoc({
      id: y.id,
      title: synopsisLabel(y),
      html,
      editUrl: y.id ? `/documents?open=${y.id}&edit=true` : undefined,
    })
  }

  const exportDocument = async (
    documentId: string | undefined,
    title: string,
    format: 'PDF' | 'DOCX' | 'MARKDOWN',
    content: string,
    sections?: Draft['sections']
  ) => {
    if (!documentId) {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Missing document id' })
      return
    }
    try {
      let resolvedContent = content
      if (!resolvedContent.trim() && documentId) {
        try {
          resolvedContent = await workspaceApi.fetchDocumentContent({ id: documentId })
        } catch { /* leave empty and let exporter decide */ }
      }
      const htmlBody = buildExportBodyHtml(resolvedContent, sections)
      const markdownBody = format === 'MARKDOWN' && !resolvedContent.trim().startsWith('<') ? resolvedContent : undefined
      await exportGeneratedDocument(documentId, format, title, htmlBody, markdownBody)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unable to export file',
      })
    }
  }

  const tools: (ToolCardProps & { key: string })[] = [
    {
      key: 'summary',
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      title: 'Summary',
      onClick: () => handleSummaryClick(),
    },
    {
      key: 'synopsis',
      icon: BookOpen,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50 dark:bg-teal-950/40',
      title: 'Synopsis',
      onClick: () => onGenerateSynopsis(webSearch),
    },
    {
      key: 'precedents',
      icon: Search,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 dark:bg-rose-950/40',
      title: 'Precedents',
      onClick: () => onGeneratePrecedent(),
    },
    {
      key: 'drafting',
      icon: PenLine,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      title: 'Drafting',
      onClick: onStartDraft,
    },
    {
      key: 'translate',
      icon: Languages,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      title: 'Translate',
      onClick: onStartTranslation,
    },
    {
      key: 'arguments',
      icon: Gavel,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      title: 'Arguments',
      locked: true,
    },
  ]

  const generatedCount = drafts.length + summaries.length + synopses.length + (precedent ? 1 : 0)

  type ActivityItem =
    | { kind: 'draft'; data: Draft }
    | { kind: 'summary'; data: CaseSummary }
    | { kind: 'synopsis'; data: CaseSynopsis }
    | { kind: 'precedent'; data: CasePrecedent }

  const activityItems = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [
      ...drafts.map(d => ({ kind: 'draft' as const, data: d })),
      ...summaries.map(s => ({ kind: 'summary' as const, data: s })),
      ...synopses.map(y => ({ kind: 'synopsis' as const, data: y })),
      ...(precedent ? [{ kind: 'precedent' as const, data: precedent }] : []),
    ]
    return items.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime())
  }, [drafts, summaries, synopses, precedent])

  const handleOpenDraft = async (draft: Draft) => {
    if (draft.status !== 'completed') return
    let d = draft
    if (!d.content && fetchDraftContent) {
      const fetched = await fetchDraftContent(d.id)
      if (fetched) d = fetched
    }
    const html = d.content?.trim()
      ? renderDraftToHtml(
        d.content,
        d.sections?.length ? d.sections : undefined,
        d.templateType,
        d.contentFormat,
      )
      : renderDraftToHtml('Preview unavailable for this document.')
    setPreviewDoc({ id: d.id, title: d.title, html, editUrl: d.id ? `/documents?open=${d.id}&edit=true` : undefined })
  }

  return (
    <div className="flex flex-col h-full bg-nb-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-nb-panel-border flex-shrink-0">
        <h3 className="text-base font-bold text-kx-text-primary">Case Studio</h3>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-nb-text-muted hover:text-kx-text-primary hover:bg-nb-sidebar-hover transition-colors flex-shrink-0"
          title="Close Studio"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {/* Tool cards grid */}
        <div className="grid grid-cols-2 gap-2 p-3">
          {tools.map(({ key, ...tool }) => (
            <ToolCard key={key} {...tool} />
          ))}
        </div>

        {/* Generated documents */}
        <div className="px-3 pb-3">
          <div className="border-t border-nb-panel-border my-2" />
          <div className="flex items-center justify-between px-2 py-2">
            <p className="text-xs font-bold tracking-wider text-nb-text-muted uppercase">
              Activity ({generatedCount})
            </p>
            {generatedCount > 0 && (
              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="flex items-center gap-1 text-[10px] font-medium text-kx-primary-600 hover:text-kx-primary-700 transition-colors"
              >
                View all
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {activityItems.map(item => {
              if (item.kind === 'precedent') {
                const p = item.data
                const isRenamingP = renamingId === `precedent-${p.id}`
                return (
                  <div
                    key={`precedent-${p.id}`}
                    className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    onClick={() => {
                      if (p.status !== 'completed') return
                      const html = renderDraftToHtml(p.content)
                      setPreviewDoc({ id: p.id, title: precedentDisplayName, html, editUrl: p.id ? `/documents?open=${p.id}&edit=true` : undefined })
                    }}
                  >
                    <div className="flex-shrink-0 h-7 w-7 rounded-md bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                      <Search className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isRenamingP ? (
                        <InlineRenameInput
                          defaultValue={precedentDisplayName}
                          onCommit={async v => { setRenamingId(null); setPrecedentDisplayName(v); await onRenamePrecedent?.(v) }}
                          onCancel={() => setRenamingId(null)}
                        />
                      ) : (
                        <>
                          <p className="text-xs font-medium text-ledger-gray-900 truncate leading-snug">{precedentDisplayName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.status === 'pending' && <span className="flex items-center gap-1 text-[10px] text-rose-600"><Loader2 className="h-2.5 w-2.5 animate-spin" />Generating...</span>}
                            {p.status === 'failed' && <span className="flex items-center gap-1 text-[10px] text-red-500"><AlertCircle className="h-2.5 w-2.5" />Failed</span>}
                            {p.status === 'completed' && <span className="text-[10px] text-ledger-gray-500">{formatRelativeTime(p.createdAt)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                    {!isRenamingP && (
                      <GeneratedItemMenu
                        onRename={() => setRenamingId(`precedent-${p.id}`)}
                        onDownloadPdf={p.status === 'completed' ? () => void exportDocument(p.id, precedentDisplayName, 'PDF', p.content) : undefined}
                        onDownloadDoc={p.status === 'completed' ? () => void exportDocument(p.id, precedentDisplayName, 'DOCX', p.content) : undefined}
                        onDelete={onDeletePrecedent}
                      />
                    )}
                  </div>
                )
              }

              if (item.kind === 'summary') {
                const s = item.data
                const isRenamingS = renamingId === `summary-${s.id}`
                const displayName = summaryLabel(s)
                return (
                  <div
                    key={`summary-${s.id}`}
                    className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                    onClick={() => { if (!isRenamingS) void handleOpenSummary(s) }}
                  >
                    <div className="flex-shrink-0 h-7 w-7 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isRenamingS ? (
                        <InlineRenameInput
                          defaultValue={displayName}
                          onCommit={async v => { setRenamingId(null); await onRenameSummary?.(s.id, v) }}
                          onCancel={() => setRenamingId(null)}
                        />
                      ) : (
                        <>
                          <p className="text-xs font-medium text-ledger-gray-900 truncate leading-snug">{displayName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {s.status === 'pending' && <span className="flex items-center gap-1 text-[10px] text-blue-600"><Loader2 className="h-2.5 w-2.5 animate-spin" />Generating...</span>}
                            {s.status === 'failed' && <span className="flex items-center gap-1 text-[10px] text-red-500"><AlertCircle className="h-2.5 w-2.5" />Failed</span>}
                            {s.status === 'completed' && <span className="text-[10px] text-ledger-gray-500">{formatRelativeTime(s.createdAt)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                    {!isRenamingS && onDeleteSummary && (
                      <GeneratedItemMenu
                        onRename={() => setRenamingId(`summary-${s.id}`)}
                        onDownloadPdf={s.status === 'completed' ? () => void exportDocument(s.id, displayName, 'PDF', s.content) : undefined}
                        onDownloadDoc={s.status === 'completed' ? () => void exportDocument(s.id, displayName, 'DOCX', s.content) : undefined}
                        onDelete={() => void onDeleteSummary(s.id)}
                      />
                    )}
                  </div>
                )
              }

              if (item.kind === 'synopsis') {
                const s = item.data
                const isRenamingY = renamingId === `synopsis-${s.id}`
                const displayName = synopsisLabel(s)
                return (
                  <div
                    key={`synopsis-${s.id}`}
                    className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-colors cursor-pointer"
                    onClick={() => { if (!isRenamingY) void handleOpenSynopsis(s) }}
                  >
                    <div className="flex-shrink-0 h-7 w-7 rounded-md bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isRenamingY ? (
                        <InlineRenameInput
                          defaultValue={displayName}
                          onCommit={async v => { setRenamingId(null); await onRenameSynopsis?.(s.id, v) }}
                          onCancel={() => setRenamingId(null)}
                        />
                      ) : (
                        <>
                          <p className="text-xs font-medium text-ledger-gray-900 truncate leading-snug">{displayName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {s.status === 'pending' && <span className="flex items-center gap-1 text-[10px] text-teal-600"><Loader2 className="h-2.5 w-2.5 animate-spin" />Generating...</span>}
                            {s.status === 'failed' && <span className="flex items-center gap-1 text-[10px] text-red-500"><AlertCircle className="h-2.5 w-2.5" />Failed</span>}
                            {s.status === 'completed' && <span className="text-[10px] text-ledger-gray-500">{formatRelativeTime(s.createdAt)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                    {!isRenamingY && (
                      <GeneratedItemMenu
                        onRename={() => setRenamingId(`synopsis-${s.id}`)}
                        onDownloadPdf={s.status === 'completed' ? () => void exportDocument(s.id, displayName, 'PDF', s.content) : undefined}
                        onDownloadDoc={s.status === 'completed' ? () => void exportDocument(s.id, displayName, 'DOCX', s.content) : undefined}
                        onDelete={() => void onDeleteSynopsis(s.id)}
                      />
                    )}
                  </div>
                )
              }

              // kind === 'draft' (legal drafts or translated documents)
              const draft = item.data
              const isTranslation = draft.sourceDocumentType === DocumentType.TRANSLATION
              const isRenaming = renamingId === draft.id
              return (
                <div
                  key={`draft-${draft.id}`}
                  className={cn(
                    'group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors',
                    isTranslation
                      ? 'hover:bg-amber-50 dark:hover:bg-amber-950/20'
                      : 'hover:bg-kx-primary-50 dark:hover:bg-kx-primary-950/20',
                    draft.status === 'completed' && 'cursor-pointer'
                  )}
                  onClick={() => handleOpenDraft(draft)}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center',
                      isTranslation
                        ? 'bg-amber-100 dark:bg-amber-900/40'
                        : 'bg-kx-primary-100 dark:bg-kx-primary-900/40'
                    )}
                  >
                    {isTranslation ? (
                      <Languages className="h-3.5 w-3.5 text-amber-700" />
                    ) : (
                      <SquarePen className="h-3.5 w-3.5 text-kx-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <InlineRenameInput
                        defaultValue={draft.title}
                        onCommit={async v => { setRenamingId(null); await onRenameDraft(draft.id, v) }}
                        onCancel={() => setRenamingId(null)}
                      />
                    ) : (
                      <>
                        <p className="text-xs font-medium text-ledger-gray-900 truncate leading-snug">{draft.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {draft.status === 'pending' && (
                            <span
                              className={cn(
                                'flex items-center gap-1 text-[10px]',
                                isTranslation ? 'text-amber-700' : 'text-kx-primary-600'
                              )}
                            >
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              {isTranslation ? 'Translating…' : 'Generating...'}
                            </span>
                          )}
                          {draft.status === 'failed' && <span className="flex items-center gap-1 text-[10px] text-red-500"><AlertCircle className="h-2.5 w-2.5" />Failed</span>}
                          {draft.status === 'completed' && <span className="text-[10px] text-ledger-gray-500">{formatRelativeTime(draft.createdAt)}</span>}
                        </div>
                      </>
                    )}
                  </div>
                  {!isRenaming && (
                    <GeneratedItemMenu
                      onRename={() => setRenamingId(draft.id)}
                      onDownloadPdf={
                        !isTranslation && draft.status === 'completed' && draft.content
                          ? () => void exportDocument(draft.id, draft.title, 'PDF', draft.content, draft.sections)
                          : undefined
                      }
                      onDownloadDoc={
                        !isTranslation && draft.status === 'completed' && draft.content
                          ? () => void exportDocument(draft.id, draft.title, 'DOCX', draft.content, draft.sections)
                          : undefined
                      }
                      onDelete={() => onDeleteDraft(draft.id)}
                    />
                  )}
                </div>
              )
            })}

            {generatedCount === 0 && (
              <p className="px-2 py-3 text-xs text-ledger-gray-400 italic">
                No generated documents yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Document preview popup */}
      {previewDoc && (
        <DocumentPreviewDialog
          open
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          htmlContent={previewDoc.html}
          onDownloadPdf={() => void exportDocument(previewDoc.id, previewDoc.title, 'PDF', previewDoc.html)}
          onDownloadDoc={() => void exportDocument(previewDoc.id, previewDoc.title, 'DOCX', previewDoc.html)}
          onEdit={previewDoc.editUrl ? () => { setPreviewDoc(null); navigate(previewDoc.editUrl!) } : undefined}
        />
      )}
    </div>
  )
}
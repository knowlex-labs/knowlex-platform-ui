import { useState, useRef, useEffect } from 'react'
import {
  PanelRight, FileText, Clock, Gavel, MessageSquare, Search, Sparkles,
  Lock, MoreVertical, Trash2, Pencil, Check, X, Loader2,
  AlertCircle, ExternalLink, BookOpen,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { renderDraftToHtml } from '@/lib/draft-renderer'
import type { Draft, CaseSummary } from '@/types'

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

function GeneratedItemMenu({ onRename, onDelete }: { onRename?: () => void; onDelete: () => void }) {
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
      setPos({ top: rect.bottom + 4, left: rect.right - 140 })
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
          className="fixed z-[9999] w-36 rounded-lg border border-nb-panel-border bg-nb-panel shadow-lg py-1"
          style={{ top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          {onRename && (
            <button type="button" onClick={() => { setOpen(false); onRename() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ledger-gray-900 hover:bg-nb-sidebar-hover transition-colors">
              <Pencil className="h-3.5 w-3.5 text-ledger-gray-400" /> Rename
            </button>
          )}
          <button type="button" onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
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
}: {
  open: boolean
  onClose: () => void
  title: string
  htmlContent: string
}) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-ledger-gray-200 flex-shrink-0">
          <DialogTitle className="truncate pr-4">{title}</DialogTitle>
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
  onGenerateSummary: () => void
  onSendToChat: (message: string) => void
  onFindPrecedents: () => void
  sourceCount: number
  caseId: string
  drafts: Draft[]
  summary: CaseSummary | null
  onDeleteDraft: (id: string) => void
  onRenameDraft: (id: string, title: string) => Promise<void>
}

export function CaseStudioPanel({
  onClose,
  onGenerateSummary,
  drafts,
  summary,
  onDeleteDraft,
  onRenameDraft,
}: CaseStudioPanelProps) {
  const navigate = useNavigate()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{ title: string; html: string } | null>(null)

  const tools: (ToolCardProps & { key: string })[] = [
    {
      key: 'summary',
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      title: 'Summary',
      onClick: onGenerateSummary,
    },
    {
      key: 'synopsis',
      icon: BookOpen,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50 dark:bg-teal-950/40',
      title: 'Synopsis',
      locked: true,
    },
    {
      key: 'timeline',
      icon: Clock,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50 dark:bg-violet-950/40',
      title: 'Timeline',
      locked: true,
    },
    {
      key: 'arguments',
      icon: Gavel,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      title: 'Arguments',
      locked: true,
    },
    {
      key: 'reply',
      icon: MessageSquare,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50 dark:bg-orange-950/40',
      title: 'Draft Reply',
      locked: true,
    },
    {
      key: 'precedents',
      icon: Search,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 dark:bg-rose-950/40',
      title: 'Precedents',
      locked: true,
    },
  ]

  const generatedCount = drafts.length + (summary ? 1 : 0)

  const handleOpenDraft = (draft: Draft) => {
    if (draft.status !== 'completed') return
    const html = renderDraftToHtml(
      draft.content,
      draft.sections?.length ? draft.sections : undefined,
      draft.templateType,
      draft.contentFormat,
    )
    setPreviewDoc({ title: draft.title, html })
  }

  const handleOpenSummary = () => {
    if (!summary || summary.status !== 'completed') return
    const html = renderDraftToHtml(summary.content)
    setPreviewDoc({ title: 'Summary', html })
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
            {/* Summary */}
            {summary && (
              <div
                className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-kx-primary-50 dark:hover:bg-kx-primary-950/20 transition-colors cursor-pointer"
                onDoubleClick={handleOpenSummary}
              >
                <div className="flex-shrink-0 h-7 w-7 rounded-md bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-kx-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ledger-gray-900 truncate leading-snug">Summary</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {summary.status === 'pending' && (
                      <span className="flex items-center gap-1 text-[10px] text-kx-primary-600">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Generating...
                      </span>
                    )}
                    {summary.status === 'failed' && (
                      <span className="flex items-center gap-1 text-[10px] text-red-500">
                        <AlertCircle className="h-2.5 w-2.5" />
                        Failed
                      </span>
                    )}
                    {summary.status === 'completed' && (
                      <span className="text-[10px] text-ledger-gray-500">
                        {formatRelativeTime(summary.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Drafts */}
            {drafts.map(draft => {
              const isRenaming = renamingId === draft.id
              return (
                <div
                  key={draft.id}
                  className={cn(
                    'group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-kx-primary-50 dark:hover:bg-kx-primary-950/20 transition-colors',
                    draft.status === 'completed' && 'cursor-pointer'
                  )}
                  onDoubleClick={() => handleOpenDraft(draft)}
                >
                  <div className="flex-shrink-0 h-7 w-7 rounded-md bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-kx-primary-600" />
                  </div>
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
                        <p className="text-xs font-medium text-ledger-gray-900 truncate leading-snug">
                          {draft.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {draft.status === 'pending' && (
                            <span className="flex items-center gap-1 text-[10px] text-kx-primary-600">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              Generating...
                            </span>
                          )}
                          {draft.status === 'failed' && (
                            <span className="text-[10px] text-red-500">Failed</span>
                          )}
                          {draft.status === 'completed' && (
                            <span className="text-[10px] text-ledger-gray-500">
                              {formatRelativeTime(draft.createdAt)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {!isRenaming && (
                    <GeneratedItemMenu
                      onRename={() => setRenamingId(draft.id)}
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
        />
      )}
    </div>
  )
}

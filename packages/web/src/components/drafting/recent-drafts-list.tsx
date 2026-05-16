import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { ChevronRight, FileText, AlertCircle, MoreVertical, Pencil, PanelLeft, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api'
import { subscribeDocumentStatus } from '@knowlex/core/api/document-status-watcher'
import { DocumentType, JobStatus } from '@knowlex/core/types'
import { toast } from '@/hooks/use-toast'

const PAGE_SIZE = 20

export interface RecentDraftsListHandle {
  refresh: () => void
}

interface RecentDraftsListProps {
  onOpenDraft: (docId: string) => void
  onCollapse?: () => void
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return 'just now'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const month = Math.floor(day / 30)
  return `${month}mo ago`
}

export const RecentDraftsList = forwardRef<RecentDraftsListHandle, RecentDraftsListProps>(
  function RecentDraftsList({ onOpenDraft, onCollapse }, ref) {
    const navigate = useNavigate()
    const [docs, setDocs] = useState<DocumentRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Per-docId unsubscribers from the shared status watcher. Refs (not
    // state) so we don't re-render every time a watch starts/stops.
    const streamsRef = useRef<Map<string, () => void>>(new Map())

    const fetchDrafts = useCallback(async () => {
      try {
        const result = await listAllDocuments({
          type: DocumentType.DRAFT,
          page: 0,
          size: PAGE_SIZE,
          // Sort by createdAt — `updatedAt` gets touched by status flips,
          // re-indexing, and signed-URL refresh, which can leapfrog a newer
          // draft below an older one that was just touched.
          sort: 'createdAt,desc',
        })
        setDocs(result.documents)
      } catch {
        setDocs([])
        toast({ title: "Couldn't load recent drafts", variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }, [])

    useEffect(() => {
      fetchDrafts()
    }, [fetchDrafts])

    useImperativeHandle(ref, () => ({
      refresh: fetchDrafts,
    }), [fetchDrafts])

    // Watch any visible PROCESSING row and re-fetch the list on terminal
    // status so the badge flips. The "Draft ready" toast itself is owned by
    // the globally-mounted <DraftTracker /> - we don't fire toasts here.
    // Uses the shared subscribeDocumentStatus watcher so multiple components
    // watching the same docId share a single poll.
    useEffect(() => {
      for (const doc of docs) {
        if (doc.jobStatus !== JobStatus.PROCESSING) continue
        if (streamsRef.current.has(doc.id)) continue

        const docId = doc.id
        const unsubscribe = subscribeDocumentStatus(docId, {
          onStatus: (statusDoc) => {
            const s = (statusDoc.jobStatus ?? '').toUpperCase()
            if (s === 'COMPLETED' || s === 'FAILED' || s === 'CANCELLED') {
              streamsRef.current.get(docId)?.()
              streamsRef.current.delete(docId)
              fetchDrafts()
            }
          },
          onError: () => { streamsRef.current.delete(docId) },
          onEnd: () => { streamsRef.current.delete(docId) },
        })
        streamsRef.current.set(docId, unsubscribe)
      }
    }, [docs, fetchDrafts])

    useEffect(() => () => {
      for (const unsubscribe of streamsRef.current.values()) unsubscribe()
      streamsRef.current.clear()
    }, [])

    return (
      <section className="flex flex-col h-full border-r border-kx-card-border bg-kx-card">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-kx-card-border flex-shrink-0">
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs font-medium text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 transition-colors"
              title="Collapse panel"
            >
              <PanelLeft className="h-3.5 w-3.5 text-ledger-gray-500" />
              <span>Drafts</span>
            </button>
          ) : (
            <span className="text-xs font-medium text-kx-text-primary px-1.5">Drafts</span>
          )}
          {!isLoading && docs.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/documents?type=DRAFT')}
              className="text-[11px] font-medium text-kx-primary-600 hover:text-kx-primary-700 px-1.5 py-1 shrink-0"
            >
              View all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="px-5 py-8 text-center text-sm text-ledger-gray-400">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="h-10 w-10 text-ledger-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-ledger-gray-600">No drafts yet</p>
            <p className="text-xs text-ledger-gray-400 mt-1">Pick a template to generate your first draft.</p>
          </div>
        ) : (
            <ul className="divide-y divide-kx-card-border">
              {docs.map((doc) => (
                <DraftRow
                  key={doc.id}
                  doc={doc}
                  onOpen={() => onOpenDraft(doc.id)}
                  onRenamed={(newName) => setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, name: newName, originalFilename: null } : d))}
                  onDeleted={() => {
                    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
                    fetchDrafts()
                  }}
                />
              ))}
            </ul>
        )}
        </div>
      </section>
    )
  }
)

function DraftRow({
  doc,
  onOpen,
  onRenamed,
  onDeleted,
}: {
  doc: DocumentRecord
  onOpen: () => void
  onRenamed: (newName: string) => void
  onDeleted: () => void
}) {
  const isFailed = doc.jobStatus === JobStatus.FAILED || doc.jobStatus === JobStatus.CANCELLED
  const title = doc.originalFilename || doc.name || 'Untitled draft'
  const canRename = doc.jobStatus !== JobStatus.PROCESSING
  const statusTime = relativeTime((doc.updatedAt ?? doc.createdAt) || new Date().toISOString())
  const statusText =
    doc.jobStatus === JobStatus.PROCESSING
      ? `Processing • Updated ${statusTime}`
      : isFailed
        ? `Failed • Updated ${statusTime}`
        : `Completed at ${statusTime}`

  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const startRename = () => {
    setRenameValue(title)
    setIsRenaming(true)
    setMenuOpen(false)
  }

  const submitRename = async () => {
    const trimmed = renameValue.trim()
    setIsRenaming(false)
    if (!trimmed || trimmed === title) return
    try {
      await workspaceApi.updateDocument(doc.id, { name: trimmed })
      onRenamed(trimmed)
      toast({ title: 'Draft renamed' })
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    try {
      await workspaceApi.deleteDocuments([doc.id])
      onDeleted()
      toast({ title: 'Draft deleted' })
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  return (
    <li
      className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors group hover:bg-kx-primary-50/40 cursor-pointer"
      onClick={isRenaming ? undefined : onOpen}
    >
      <div
        className={cn(
          'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
          isFailed ? 'bg-red-50 text-red-500' : 'bg-violet-100 text-violet-700',
          !isRenaming && 'cursor-pointer',
        )}
        onClick={isRenaming ? undefined : onOpen}
      >
        {isFailed ? <AlertCircle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename()
              else if (e.key === 'Escape') setIsRenaming(false)
            }}
            onBlur={submitRename}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-[13px] font-medium text-kx-text-primary bg-nb-input border border-kx-primary-300 rounded px-2 py-0.5 outline-none focus:border-kx-primary-500"
          />
        ) : (
          <p
            className="text-[13px] font-medium text-kx-text-primary leading-snug line-clamp-2 cursor-pointer"
            onClick={onOpen}
          >
            {title}
          </p>
        )}
        <p className="mt-1 text-[10px] text-ledger-gray-500 truncate">{statusText}</p>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {canRename && !isRenaming && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
              className="h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-lg border border-kx-card-border bg-kx-card shadow-lg py-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startRename() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-text-primary hover:bg-ledger-gray-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-ledger-gray-400" />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void handleDelete() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-ledger-gray-300 group-hover:text-kx-primary-600" />
      </div>
    </li>
  )
}

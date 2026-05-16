import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { ChevronRight, Languages, AlertCircle, Loader2, PanelLeft, MoreVertical, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api'
import { subscribeDocumentStatus } from '@knowlex/core/api/document-status-watcher'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api'
import { DocumentType, JobStatus } from '@knowlex/core/types'
import { toast } from '@/hooks/use-toast'

const PAGE_SIZE = 20

export interface RecentTranslationsListHandle {
  refresh: () => void
}

interface RecentTranslationsListProps {
  onOpenTranslation: (doc: DocumentRecord) => void
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

export const RecentTranslationsList = forwardRef<RecentTranslationsListHandle, RecentTranslationsListProps>(
  function RecentTranslationsList({ onOpenTranslation, onCollapse }, ref) {
    const navigate = useNavigate()
    const [docs, setDocs] = useState<DocumentRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const streamsRef = useRef<Map<string, () => void>>(new Map())

    const fetchTranslations = useCallback(async () => {
      try {
        const result = await listAllDocuments({
          type: DocumentType.TRANSLATION,
          page: 0,
          size: PAGE_SIZE,
          sort: 'createdAt,desc',
        })
        setDocs(result.documents)
      } catch {
        setDocs([])
        toast({ title: "Couldn't load recent translations", variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }, [])

    useEffect(() => {
      fetchTranslations()
    }, [fetchTranslations])

    useImperativeHandle(ref, () => ({ refresh: fetchTranslations }), [fetchTranslations])

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
              fetchTranslations()
            }
          },
          onError: () => { streamsRef.current.delete(docId) },
          onEnd: () => { streamsRef.current.delete(docId) },
        })
        streamsRef.current.set(docId, unsubscribe)
      }
    }, [docs, fetchTranslations])

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
              <span>Files</span>
            </button>
          ) : (
            <span className="text-xs font-medium text-kx-text-primary px-1.5">Files</span>
          )}
          {!isLoading && docs.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/documents?type=TRANSLATION')}
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
              <Languages className="h-10 w-10 text-ledger-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-ledger-gray-600">No translations yet</p>
              <p className="text-xs text-ledger-gray-400 mt-1">Upload or select a document to translate.</p>
            </div>
          ) : (
            <ul className="divide-y divide-kx-card-border">
                {docs.map((doc) => (
                  <TranslationRow
                    key={doc.id}
                    doc={doc}
                    onOpen={() => onOpenTranslation(doc)}
                    onDeleted={() => {
                      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
                      fetchTranslations()
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

function TranslationRow({
  doc,
  onOpen,
  onDeleted,
}: {
  doc: DocumentRecord
  onOpen: () => void
  onDeleted: () => void
}) {
  const isFailed = doc.jobStatus === JobStatus.FAILED || doc.jobStatus === JobStatus.CANCELLED
  const isProcessing = doc.jobStatus === JobStatus.PROCESSING
  const canDelete = !isProcessing
  const title = doc.originalFilename || doc.name || 'Untitled'
  const statusTime = relativeTime((doc.updatedAt ?? doc.createdAt) || new Date().toISOString())
  const statusText =
    isProcessing
      ? `Translating • Updated ${statusTime}`
      : isFailed
        ? `Failed • Updated ${statusTime}`
        : `Completed at ${statusTime}`
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const handleDelete = async () => {
    setMenuOpen(false)
    try {
      await workspaceApi.deleteDocuments([doc.id])
      onDeleted()
      toast({ title: 'Translation deleted' })
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  return (
    <li
      className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors group cursor-pointer hover:bg-kx-primary-50/40"
      onClick={onOpen}
    >
      <div className={cn(
        'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
        isFailed ? 'bg-red-50 text-red-500' : 'bg-teal-50 text-teal-600',
      )}>
        {isFailed ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Languages className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-kx-text-primary leading-snug line-clamp-2">{title}</p>
        <p className="mt-1 text-[10px] text-ledger-gray-500 truncate">{statusText}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canDelete && (
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

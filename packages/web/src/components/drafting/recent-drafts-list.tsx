import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { ChevronRight, FileText, AlertCircle, FolderOpen, Tag, Loader2, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api'
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { DocumentType, JobStatus } from '@knowlex/core/types'
import { toast } from '@/hooks/use-toast'

const PAGE_SIZE = 5

export interface RecentDraftsListHandle {
  refresh: () => void
}

interface RecentDraftsListProps {
  onOpenDraft: (docId: string) => void
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

function formatSubtype(s: string | null | undefined): string {
  if (!s) return '—'
  return s
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const RecentDraftsList = forwardRef<RecentDraftsListHandle, RecentDraftsListProps>(
  function RecentDraftsList({ onOpenDraft }, ref) {
    const navigate = useNavigate()
    const [docs, setDocs] = useState<DocumentRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const streamsRef = useRef<Map<string, AbortController>>(new Map())

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
    useEffect(() => {
      for (const doc of docs) {
        if (doc.jobStatus !== JobStatus.PROCESSING) continue
        if (streamsRef.current.has(doc.id)) continue

        const docId = doc.id
        const ctrl = workspaceApi.pollDocumentStatus(docId, {
          onStatus: (statusDoc) => {
            const s = (statusDoc.jobStatus ?? '').toUpperCase()
            if (s === 'COMPLETED' || s === 'FAILED' || s === 'CANCELLED') {
              streamsRef.current.get(docId)?.abort()
              streamsRef.current.delete(docId)
              fetchDrafts()
            }
          },
          onError: () => { streamsRef.current.delete(docId) },
          onEnd: () => { streamsRef.current.delete(docId) },
        })
        streamsRef.current.set(docId, ctrl)
      }
    }, [docs, fetchDrafts])

    useEffect(() => () => {
      for (const ctrl of streamsRef.current.values()) ctrl.abort()
      streamsRef.current.clear()
    }, [])

    return (
      <section className="bg-kx-card border border-kx-card-border rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-kx-card-border">
          <div>
            <h2 className="text-base font-semibold text-kx-text-primary">Recent drafts</h2>
            <p className="text-xs text-ledger-gray-500 mt-0.5">Your latest generated drafts</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/documents?type=DRAFT')}
            className="text-xs text-kx-primary-600 hover:text-kx-primary-700 h-8"
          >
            View all
          </Button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="px-5 py-8 text-center text-sm text-ledger-gray-400">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="h-10 w-10 text-ledger-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-ledger-gray-600">No drafts yet</p>
            <p className="text-xs text-ledger-gray-400 mt-1">Pick a template above to generate your first draft.</p>
          </div>
        ) : (
          <ul className="divide-y divide-kx-card-border">
            {docs.map((doc) => (
              <DraftRow key={doc.id} doc={doc} onOpen={() => onOpenDraft(doc.id)} />
            ))}
          </ul>
        )}
      </section>
    )
  }
)

function StatusBadge({ status }: { status: JobStatus | null }) {
  if (status === JobStatus.PROCESSING) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-kx-primary-50 text-kx-primary-700 dark:bg-kx-primary-900/30 dark:text-kx-primary-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </span>
    )
  }
  if (status === JobStatus.FAILED || status === JobStatus.CANCELLED) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <AlertCircle className="h-3 w-3" />
        Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
      <Check className="h-3 w-3" />
      Completed
    </span>
  )
}

function DraftRow({ doc, onOpen }: { doc: DocumentRecord; onOpen: () => void }) {
  const isFailed = doc.jobStatus === JobStatus.FAILED || doc.jobStatus === JobStatus.CANCELLED
  const title = doc.originalFilename || doc.name || 'Untitled draft'
  const subtypeLabel = formatSubtype(doc.subType)

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors group hover:bg-kx-primary-50/40 cursor-pointer"
      >
        <div className={cn(
          'flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
          isFailed ? 'bg-red-50 text-red-500' : 'bg-violet-100 text-violet-700'
        )}>
          {isFailed ? <AlertCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-kx-text-primary truncate">{title}</p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-ledger-gray-500">
            <span className="inline-flex items-center gap-1 min-w-0">
              <Tag className="h-3 w-3 text-ledger-gray-400 flex-shrink-0" />
              <span className="truncate">{subtypeLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1 min-w-0 max-w-[180px]">
              <FolderOpen className="h-3 w-3 text-ledger-gray-400 flex-shrink-0" />
              <span className="truncate">
                {doc.caseTitle ?? <span className="text-ledger-gray-400">Standalone</span>}
              </span>
            </span>
            <span className="text-ledger-gray-400 whitespace-nowrap">
              {relativeTime(doc.createdAt ?? doc.updatedAt)}
            </span>
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={doc.jobStatus} />
          <ChevronRight className="h-4 w-4 text-ledger-gray-300 group-hover:text-kx-primary-600" />
        </div>
      </button>
    </li>
  )
}

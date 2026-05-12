import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { ChevronRight, Languages, AlertCircle, FolderOpen, Loader2, Check, PanelLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api'
import { subscribeDocumentStatus } from '@knowlex/core/api/document-status-watcher'
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

function formatLanguage(s: string | null | undefined): string {
  if (!s) return '—'
  return s
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
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
        <div className="flex flex-col gap-3 px-4 py-4 border-b border-kx-card-border flex-shrink-0">
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="flex items-center gap-2 self-start px-2 py-1.5 -mx-2 rounded-md text-sm font-medium text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 transition-colors"
              title="Collapse panel"
            >
              <PanelLeft className="h-4 w-4 text-ledger-gray-500" />
              <span>Files</span>
            </button>
          )}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-kx-text-primary">Recent</h2>
              <p className="text-xs text-ledger-gray-500 mt-0.5">Your translated documents</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/documents?type=TRANSLATION')}
              className="text-xs text-kx-primary-600 hover:text-kx-primary-700 h-8 flex-shrink-0"
            >
              View all
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
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
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    )
  }
)

function StatusBadge({ status }: { status: JobStatus | null }) {
  if (status === JobStatus.PROCESSING) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Translating
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
      Done
    </span>
  )
}

function TranslationRow({ doc, onOpen }: { doc: DocumentRecord; onOpen: () => void }) {
  const isFailed = doc.jobStatus === JobStatus.FAILED || doc.jobStatus === JobStatus.CANCELLED
  const isProcessing = doc.jobStatus === JobStatus.PROCESSING
  const title = doc.originalFilename || doc.name || 'Untitled'
  const targetLang = formatLanguage(doc.subType)

  return (
    <li
      className="w-full flex items-center gap-3 px-4 py-3 transition-colors group cursor-pointer hover:bg-kx-primary-50/40"
      onClick={onOpen}
    >
      <div className={cn(
        'flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
        isFailed ? 'bg-red-50 text-red-500' : 'bg-teal-50 text-teal-600',
      )}>
        {isFailed ? <AlertCircle className="h-4 w-4" /> : <Languages className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-kx-text-primary truncate">{title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ledger-gray-500">
          {targetLang !== '—' && (
            <span className="font-medium text-teal-600 dark:text-teal-400">{targetLang}</span>
          )}
          {doc.caseTitle && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <FolderOpen className="h-3 w-3 text-ledger-gray-400 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{doc.caseTitle}</span>
            </span>
          )}
          <span className="text-ledger-gray-400 whitespace-nowrap">
            {relativeTime(doc.createdAt ?? doc.updatedAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={doc.jobStatus} />
        <ChevronRight className="h-4 w-4 text-ledger-gray-300 group-hover:text-kx-primary-600" />
      </div>
    </li>
  )
}

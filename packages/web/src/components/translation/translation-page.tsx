import { useState, useRef, useCallback, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import { ArrowLeft, Download, RotateCcw, AlertCircle, Loader2, FileText, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GeneratingState } from '@/components/ui/generating-state'
import { workspaceApi, type CreateDocumentResponse } from '@knowlex/core/api/workspace-api'
import {
  triggerDirectDownload,
  downloadDocument,
  docProcessingApi,
  listAllDocuments,
} from '@knowlex/core/api/doc-processing-api'
import { subscribeDocumentStatus } from '@knowlex/core/api/document-status-watcher'
import { DocumentType, JobStatus } from '@knowlex/core/types'
import { toast } from '@/hooks/use-toast'
import { useUIState } from '@/contexts/ui-context'
import {
  RecentTranslationsList,
  type RecentTranslationsListHandle,
} from './recent-translations-list'
import { TranslationWorkspace, type TranslationJobInfo } from './translation-workspace'
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api'

type ViewerStatus = 'processing' | 'done' | 'error'

interface ActiveJob extends TranslationJobInfo {
  viewerStatus: ViewerStatus
  errorMsg: string | null
}
const TRANSLATION_PANEL_WIDTH_KEY = 'knowlex_translation_recent_panel_width'
const MIN_PANEL_WIDTH = 260
const MAX_PANEL_WIDTH = 460

function translatedFileName(sourceFileName: string, targetLang: string, extension: 'pdf' | 'docx') {
  const baseName = (sourceFileName || 'translation').replace(/\.[^.]+$/, '')
  const langSuffix = (targetLang || 'translation')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, '_')
  return `${baseName}_${langSuffix}.${extension}`
}

function pdfViewerUrl(blobUrl: string) {
  // The embedded browser PDF toolbar downloads blob URLs using their UUID. Hide it
  // so users use our named app download buttons instead.
  return `${blobUrl}#toolbar=0&navpanes=0`
}

function sourceBaseName(translated: DocumentRecord): string {
  // The translated record carries:
  //   name             ≈ "Nakul_Jain_Resume - (hindi)"
  //   originalFilename ≈ "Nakul_Jain_Resume_Hindi.pdf"
  // Both encode the source name plus a language tag — we strip the tag to
  // recover the base name we can search for.
  const fromName = (translated.name ?? '').replace(/\s*-\s*\([^)]+\)\s*$/, '').trim()
  if (fromName) return fromName
  const raw = (translated.originalFilename ?? '').replace(/\.[^.]+$/, '')
  return raw.replace(/_([A-Za-z]+)$/, '').trim()
}

async function findSourceDocId(translated: DocumentRecord): Promise<string> {
  const base = sourceBaseName(translated)
  if (!base) return ''
  try {
    const { documents } = await listAllDocuments({
      search: base,
      size: 20,
      page: 0,
      sort: 'createdAt,desc',
    })
    const nonTranslations = documents.filter(d => d.type !== DocumentType.TRANSLATION)
    if (!nonTranslations.length) return ''
    const exact = nonTranslations.find(d => {
      const fn = (d.originalFilename ?? '').replace(/\.[^.]+$/, '')
      return fn === base || d.name === base
    })
    return (exact ?? nonTranslations[0]).id
  } catch {
    return ''
  }
}

export function TranslationPage() {
  const { setSidebarCollapsed } = useUIState()
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const raw = localStorage.getItem(TRANSLATION_PANEL_WIDTH_KEY)
    const parsed = raw ? Number(raw) : NaN
    return Number.isFinite(parsed) ? Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, parsed)) : 288
  })
  const [sourceBlobUrl, setSourceBlobUrl] = useState<string | null>(null)
  const [translatedBlobUrl, setTranslatedBlobUrl] = useState<string | null>(null)
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const recentListRef = useRef<RecentTranslationsListHandle>(null)
  const pageRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSidebarCollapsed(true) }, [setSidebarCollapsed])
  useEffect(() => {
    localStorage.setItem(TRANSLATION_PANEL_WIDTH_KEY, String(panelWidth))
  }, [panelWidth])

  const handlePanelResizeStart = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const pageLeft = pageRootRef.current?.getBoundingClientRect().left ?? 0
    const onMouseMove = (moveEvent: MouseEvent) => {
      const next = moveEvent.clientX - pageLeft
      setPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, next)))
    }
    const onMouseUp = () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const stopStream = () => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
  }

  // Fetch source doc blob URL whenever we enter a job (immediately)
  useEffect(() => {
    let revoked = false
    let url: string | null = null

    if (!activeJob?.sourceDocId) {
      setSourceBlobUrl(null)
      return
    }

    workspaceApi.fetchDocumentPreviewBlobUrl(activeJob.sourceDocId)
      .then(blobUrl => {
        if (revoked) { URL.revokeObjectURL(blobUrl); return }
        url = blobUrl
        setSourceBlobUrl(blobUrl)
      })
      .catch(() => setSourceBlobUrl(null))

    return () => {
      revoked = true
      if (url) URL.revokeObjectURL(url)
      setSourceBlobUrl(null)
    }
  }, [activeJob?.sourceDocId])

  // Fetch translated doc blob URL when translation completes
  useEffect(() => {
    let revoked = false
    let url: string | null = null

    if (activeJob?.viewerStatus !== 'done') {
      setTranslatedBlobUrl(null)
      return
    }

    workspaceApi.fetchDocumentPreviewBlobUrl(activeJob.translatedDocId)
      .then(blobUrl => {
        if (revoked) { URL.revokeObjectURL(blobUrl); return }
        url = blobUrl
        setTranslatedBlobUrl(blobUrl)
      })
      .catch(() => setTranslatedBlobUrl(null))

    return () => {
      revoked = true
      if (url) URL.revokeObjectURL(url)
      setTranslatedBlobUrl(null)
    }
  }, [activeJob?.viewerStatus, activeJob?.translatedDocId])

  // Clean up blob URLs when leaving a job
  useEffect(() => {
    if (!activeJob) {
      setSourceBlobUrl(null)
      setTranslatedBlobUrl(null)
    }
  }, [activeJob])

  const startPolling = useCallback((docId: string) => {
    stopStream()
    unsubscribeRef.current = subscribeDocumentStatus(docId, {
      onStatus: (doc: CreateDocumentResponse) => {
        const s = (doc.jobStatus ?? doc.status ?? '').toString().toUpperCase()
        if (s === 'COMPLETED') {
          stopStream()
          setActiveJob(prev => prev ? { ...prev, viewerStatus: 'done' } : prev)
          recentListRef.current?.refresh()
        } else if (s === 'FAILED' || s === 'CANCELLED') {
          stopStream()
          setActiveJob(prev => prev
            ? { ...prev, viewerStatus: 'error', errorMsg: 'Translation failed. Please try again.' }
            : prev
          )
          recentListRef.current?.refresh()
        }
      },
      onError: () => {
        stopStream()
        setActiveJob(prev => prev
          ? { ...prev, viewerStatus: 'error', errorMsg: 'Lost connection while translating.' }
          : prev
        )
      },
      onEnd: () => stopStream(),
    })
  }, [])

  const handleJobStarted = useCallback((info: TranslationJobInfo) => {
    setActiveJob({ ...info, viewerStatus: 'processing', errorMsg: null })
    startPolling(info.translatedDocId)
    // Immediately refresh the recent list so the new processing row appears
    // without waiting for the job to complete.
    recentListRef.current?.refresh()
  }, [startPolling])

  const handleOpenTranslation = useCallback((doc: DocumentRecord) => {
    const isProcessing = doc.jobStatus === JobStatus.PROCESSING
    const isFailed = doc.jobStatus === JobStatus.FAILED || doc.jobStatus === JobStatus.CANCELLED
    const viewerStatus: ViewerStatus = isProcessing ? 'processing' : isFailed ? 'error' : 'done'

    setActiveJob({
      translatedDocId: doc.id,
      sourceDocId: '',
      sourceFileName: sourceBaseName(doc) || doc.originalFilename || doc.name || 'Document',
      targetLang: doc.subType ?? '',
      viewerStatus,
      errorMsg: isFailed ? 'Translation failed. Please try again.' : null,
    })

    if (isProcessing) {
      startPolling(doc.id)
    }

    findSourceDocId(doc).then(sourceDocId => {
      if (!sourceDocId) return
      setActiveJob(prev =>
        prev && prev.translatedDocId === doc.id && !prev.sourceDocId
          ? { ...prev, sourceDocId }
          : prev,
      )
    })
  }, [startPolling])

  const handleBack = () => {
    stopStream()
    setActiveJob(null)
  }

  const handleDownloadPdf = () => {
    if (!activeJob) return
    downloadDocument(
      activeJob.translatedDocId,
      translatedFileName(activeJob.sourceFileName, activeJob.targetLang, 'pdf'),
    ).catch(() => toast({ title: 'Download failed', variant: 'destructive' }))
  }

  const handleDownloadDocx = async () => {
    if (!activeJob) return
    setIsDownloadingDocx(true)
    try {
      const res = await docProcessingApi.convert({
        documentId: activeJob.translatedDocId,
        targetFormat: 'DOCX',
      })
      const url = res.data?.documents?.[0]?.downloadUrl
      if (!url) throw new Error('No download URL in response')
      triggerDirectDownload(url, translatedFileName(activeJob.sourceFileName, activeJob.targetLang, 'docx'))
    } catch {
      toast({ title: 'DOCX export failed', variant: 'destructive' })
    } finally {
      setIsDownloadingDocx(false)
    }
  }

  return (
    <div ref={pageRootRef} className="flex h-full bg-kx-surface overflow-hidden">
      {/* ── Left panel — always mounted, collapsible ── */}
      {panelOpen && (
        <div style={{ width: panelWidth }} className="flex-shrink-0 overflow-hidden flex flex-col">
          <RecentTranslationsList
            ref={recentListRef}
            onOpenTranslation={handleOpenTranslation}
            onCollapse={() => setPanelOpen(false)}
          />
        </div>
      )}
      {panelOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handlePanelResizeStart}
          className="w-1.5 cursor-col-resize bg-transparent hover:bg-kx-primary-100 dark:hover:bg-kx-primary-900/30 transition-colors flex-shrink-0"
          title="Resize panel"
        />
      )}

      {/* ── Right area ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {activeJob ? (
          // ── Viewer mode ──────────────────────────────────────────────────
          <>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-kx-card-border bg-kx-card flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* Re-open panel button — only visible when panel is collapsed */}
                {!panelOpen && (
                  <button
                    type="button"
                    onClick={() => setPanelOpen(true)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 transition-colors flex-shrink-0"
                    title="Show files"
                  >
                    <PanelLeft className="h-4 w-4 text-ledger-gray-500" />
                    <span>Files</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-ledger-gray-500 hover:text-kx-primary-600 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <span className="text-ledger-gray-300 flex-shrink-0">|</span>

                <span className="text-sm font-medium text-kx-text-primary truncate">
                  {activeJob.sourceFileName}
                </span>

                {activeJob.targetLang && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 flex-shrink-0">
                    → {activeJob.targetLang}
                  </span>
                )}
              </div>

              {activeJob.viewerStatus === 'done' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={isDownloadingDocx}
                    onClick={handleDownloadDocx}
                  >
                    {isDownloadingDocx
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Download className="h-3.5 w-3.5" />
                    }
                    DOCX
                  </Button>
                </div>
              )}
            </div>

            {/* Split panes */}
            <div className="flex-1 min-h-0 flex">
              {/* Left pane — original */}
              <div className="flex-1 min-w-0 border-r border-kx-card-border flex flex-col">
                <div className="px-4 py-2 border-b border-kx-card-border bg-nb-panel flex-shrink-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ledger-gray-400">Original</span>
                </div>
                <div className="flex-1 min-h-0">
                  {sourceBlobUrl ? (
                    <iframe
                      src={pdfViewerUrl(sourceBlobUrl)}
                      className="w-full h-full border-0"
                      title="Original document"
                    />
                  ) : activeJob.sourceDocId ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-ledger-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm">Loading original…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-ledger-gray-400">
                      <FileText className="h-10 w-10" />
                      <p className="text-sm font-medium text-ledger-gray-600">
                        {activeJob.sourceFileName || 'Original document'}
                      </p>
                      <p className="text-xs">Source preview unavailable</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right pane — translation */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="px-4 py-2 border-b border-kx-card-border bg-nb-panel flex-shrink-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ledger-gray-400">
                    {activeJob.targetLang ? `Translation · ${activeJob.targetLang}` : 'Translation'}
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  {activeJob.viewerStatus === 'processing' && (
                    <GeneratingState label="Translation" />
                  )}
                  {activeJob.viewerStatus === 'error' && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                      <AlertCircle className="h-10 w-10 text-red-500" />
                      <p className="text-base font-semibold text-kx-text-primary">Translation failed</p>
                      <p className="text-sm text-ledger-gray-500 text-center">
                        {activeJob.errorMsg ?? 'Something went wrong.'}
                      </p>
                      <Button variant="ghost" className="gap-1.5" onClick={handleBack}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Try again
                      </Button>
                    </div>
                  )}
                  {activeJob.viewerStatus === 'done' && (
                    translatedBlobUrl ? (
                      <iframe
                        src={pdfViewerUrl(translatedBlobUrl)}
                        className="w-full h-full border-0"
                        title="Translated document"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-ledger-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm">Loading preview…</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // ── Home mode ──────────────────────────────────────────────────
          <>
            {/* Slim top bar — re-open button only visible when panel is collapsed */}
            {!panelOpen && (
              <div className="flex items-center px-4 py-2 border-b border-kx-card-border bg-kx-card flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 transition-colors"
                  title="Show files"
                >
                  <PanelLeft className="h-4 w-4 text-ledger-gray-500" />
                  <span>Files</span>
                </button>
              </div>
            )}
            <TranslationWorkspace onJobStarted={handleJobStarted} />
          </>
        )}
      </div>
    </div>
  )
}

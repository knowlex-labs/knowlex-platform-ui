import { useState, useEffect, useRef, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DraftCreationWizard } from '@/components/cases/case-workspace/draft-creation-wizard'
import { draftsApi } from '@/services/api/drafts-api'
import { downloadDocument } from '@/services/api/doc-processing-api'
import { toast } from '@/hooks/use-toast'
import type { Draft } from '@/types'
import type { DraftListItem } from '@/services/api/drafts-api'
import type { CreateDraftRequest } from '@/services/api/document-types'

const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 24 // 2 minutes

function mapItemToDraft(item: DraftListItem): Draft {
  const status = (() => {
    const s = String(item.status ?? '').toLowerCase()
    if (s === 'completed') return 'completed' as const
    if (s === 'failed') return 'failed' as const
    return 'pending' as const
  })()
  return {
    id: item.id,
    title: item.title || item.metadata?.title || 'Untitled Draft',
    content: item.draft_body ?? '',
    status,
    sections: item.sections || [],
    summary: item.metadata?.summary || '',
    templateType: item.document_type || item.metadata?.document_type,
    contentFormat: (item.content_format as Draft['contentFormat']) || undefined,
    createdAt: new Date(item.created_at),
    updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(item.created_at),
  }
}

interface DraftingDialogProps {
  onBack: () => void
}

export function DraftingDialog({ onBack }: DraftingDialogProps) {
  const [previewDraft, setPreviewDraft] = useState<Draft | null>(null)
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null)
  const [savedDraftTitle, setSavedDraftTitle] = useState<string>('Draft')
  const [showDownload, setShowDownload] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const pollAttemptsRef = useRef(0)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jobIdRef = useRef<string | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const startPolling = useCallback((jobId: string) => {
    stopPolling()
    pollAttemptsRef.current = 0
    jobIdRef.current = jobId

    pollTimerRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1
      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling()
        setPreviewDraft((prev) => prev ? { ...prev, status: 'failed' } : null)
        return
      }
      try {
        const res = await draftsApi.getStandalone(jobId)
        if (res.data) {
          const draft = mapItemToDraft(res.data)
          setPreviewDraft(draft)
          if (draft.status === 'completed' || draft.status === 'failed') {
            stopPolling()
          }
        }
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL_MS)
  }, [stopPolling])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setPreviewDraft(null)
    setSavedDraftId(null)
    setSavedDraftTitle('Draft')
    setShowDownload(false)
    pollAttemptsRef.current = 0
    jobIdRef.current = null
  }, [stopPolling])

  const handleGenerate = async (request: CreateDraftRequest) => {
    try {
      const res = await draftsApi.createStandalone(request)
      if (!res.data) throw new Error('No data returned')
      const draft = mapItemToDraft(res.data)
      setPreviewDraft(draft)
      if (draft.status !== 'completed' && draft.status !== 'failed') {
        startPolling(res.data.job_id)
      }
    } catch {
      toast({ title: 'Failed to start draft generation', variant: 'destructive' })
    }
  }

  const handleSave = () => {
    if (previewDraft) {
      setSavedDraftId(previewDraft.id)
      setSavedDraftTitle(previewDraft.title)
      setShowDownload(true)
      toast({ title: 'Draft ready', description: 'Download your draft below.' })
    }
  }

  const handleDiscard = (_draftId: string) => {
    reset()
  }

  const handleCancel = () => {
    reset()
    onBack()
  }

  const handleDownload = async () => {
    if (!savedDraftId) return
    setIsDownloading(true)
    try {
      await downloadDocument(savedDraftId, savedDraftTitle)
    } catch {
      toast({ title: 'Download failed', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setIsDownloading(false)
    }
  }

  if (showDownload && savedDraftId) {
    return (
      <div>
        <div className="flex justify-center mt-6">
          <div className="w-full max-w-md bg-kx-card border border-kx-card-border rounded-xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-serif font-semibold text-kx-primary-900">Your draft is ready</p>
            <p className="text-sm text-ledger-gray-500">Download it to your device.</p>
            <Button className="gap-2 px-6" disabled={isDownloading} onClick={handleDownload}>
              {isDownloading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />
              }
              Download Draft
            </Button>
            <Button variant="ghost" onClick={reset} className="text-sm">
              Create another draft
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className="bg-kx-card border border-kx-card-border rounded-xl shadow-sm overflow-hidden"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        <DraftCreationWizard
          sources={[]}
          client={null}
          onGenerate={handleGenerate}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onCancel={handleCancel}
          previewDraft={previewDraft}
        />
      </div>
    </div>
  )
}

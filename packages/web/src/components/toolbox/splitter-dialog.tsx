import { useState } from 'react'
import { Loader2, Download, RotateCcw, ArrowLeft, FileText, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUploadZone } from './file-upload-zone'
import {
  uploadToolboxFile,
  docProcessingApi,
  downloadDocument,
} from '@knowlex/core/api/doc-processing-api'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { ApiError } from '@knowlex/core/api/api-client'
import { toast } from '@/hooks/use-toast'
import type { ProcessedDocumentInfo } from '@knowlex/core/api/doc-processing-api'

type Stage = 'upload' | 'processing' | 'done' | 'error'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface SplitterDialogProps {
  onBack: () => void
  initialDoc?: ProcessedDocumentInfo
}

export function SplitterDialog({ onBack, initialDoc }: SplitterDialogProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preloadedDoc, setPreloadedDoc] = useState<ProcessedDocumentInfo | null>(initialDoc ?? null)
  const [pageRanges, setPageRanges] = useState('')
  const [result, setResult] = useState<ProcessedDocumentInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)

  const reset = () => {
    setStage('upload')
    setFile(null)
    setPreloadedDoc(initialDoc ?? null)
    setPageRanges('')
    setResult(null)
    setError(null)
  }

  const handleSplit = async () => {
    if (!preloadedDoc && !file) return
    setStage('processing')
    setError(null)
    try {
      const documentId = preloadedDoc ? preloadedDoc.id : await uploadToolboxFile(file!)
      const res = await docProcessingApi.split({ documentId, pageRanges: pageRanges.trim() || undefined })
      const doc = res.data?.documents?.[0] ?? null
      setResult(doc)
      setStage('done')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
      setStage('error')
    }
  }

  const handleDownload = async () => {
    if (!result) return
    setIsDownloading(true)
    try {
      await downloadDocument(result.downloadUrl ?? result.id, result.fileName)
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDiscard = async () => {
    if (!result) return
    setIsDiscarding(true)
    try {
      await workspaceApi.deleteDocuments([result.id])
      toast({ title: 'Document discarded' })
      reset()
    } catch {
      toast({ title: 'Failed to discard', variant: 'destructive' })
    } finally {
      setIsDiscarding(false)
    }
  }

  const hasInput = preloadedDoc !== null || file !== null

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-ledger-gray-500 hover:text-kx-primary-600 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Documents
      </button>

      <div className="flex justify-center mt-6">
        <div className="w-full max-w-lg bg-kx-card border border-kx-card-border rounded-xl p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-serif font-semibold text-kx-primary-900">Split PDF</h2>
            <p className="text-sm text-ledger-gray-500 mt-0.5">Split a PDF into multiple documents by page ranges.</p>
          </div>

          <div className="space-y-4">
            {stage === 'upload' || stage === 'error' ? (
              <>
                {preloadedDoc ? (
                  <div className="flex items-center gap-3 rounded-lg border border-kx-primary-200 dark:border-kx-primary-800 bg-kx-primary-50 dark:bg-kx-primary-950/20 px-3 py-2.5">
                    <FileText className="h-4 w-4 flex-shrink-0 text-kx-primary-500" />
                    <span className="flex-1 truncate text-sm font-medium text-kx-primary-900">{preloadedDoc.fileName}</span>
                    <span className="text-xs text-ledger-gray-400 flex-shrink-0">{formatSize(preloadedDoc.fileSize)}</span>
                    {!initialDoc && (
                      <button
                        type="button"
                        onClick={() => setPreloadedDoc(null)}
                        className="flex-shrink-0 rounded p-0.5 text-ledger-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <FileUploadZone
                    accept=".pdf"
                    label="Drop your PDF here or click to browse"
                    selectedFiles={file ? [file] : []}
                    onFilesSelected={(files) => setFile(files[0])}
                    onRemoveFile={() => setFile(null)}
                  />
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="page-ranges">Page ranges</Label>
                  <Input
                    id="page-ranges"
                    placeholder='e.g. 1-3, 5, 7-9'
                    value={pageRanges}
                    onChange={(e) => setPageRanges(e.target.value)}
                  />
                  <p className="text-xs text-ledger-gray-400">Leave blank to split every page individually</p>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button className="w-full" disabled={!hasInput} onClick={handleSplit}>
                  Split PDF
                </Button>
              </>
            ) : stage === 'processing' ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-kx-primary-500" />
                <p className="text-sm text-kx-primary-900">Splitting your PDF…</p>
              </div>
            ) : result ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-kx-card-border bg-ledger-gray-50 dark:bg-ledger-gray-800/40 px-3 py-2.5">
                  <FileText className="h-4 w-4 flex-shrink-0 text-kx-primary-500" />
                  <span className="flex-1 truncate text-sm text-kx-primary-900">{result.fileName}</span>
                  <span className="text-xs text-ledger-gray-400 flex-shrink-0">{formatSize(result.fileSize)}</span>
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={isDownloading}
                  onClick={handleDownload}
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download
                </Button>

                <Button
                  variant="ghost"
                  className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  disabled={isDiscarding}
                  onClick={handleDiscard}
                >
                  {isDiscarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Discard
                </Button>

                <Button variant="ghost" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Split another file
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

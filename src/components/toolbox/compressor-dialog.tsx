import { useState } from 'react'
import { Loader2, Download, RotateCcw, ArrowLeft, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FileUploadZone } from './file-upload-zone'
import {
  uploadToolboxFile,
  docProcessingApi,
  downloadDocument,
} from '@/services/api/doc-processing-api'
import { draftsApi } from '@/services/api/drafts-api'
import { ApiError } from '@/services/api/api-client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ProcessedDocumentInfo } from '@/services/api/doc-processing-api'

type Stage = 'upload' | 'processing' | 'done' | 'error'
type Quality = 'low' | 'medium' | 'high'

const QUALITY_OPTIONS: { value: Quality; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Smallest file, reduced quality' },
  { value: 'medium', label: 'Medium', description: 'Balanced size and quality' },
  { value: 'high', label: 'High', description: 'Best quality, larger file' },
]

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface CompressorDialogProps {
  onBack: () => void
  initialDoc?: ProcessedDocumentInfo
}

export function CompressorDialog({ onBack, initialDoc }: CompressorDialogProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preloadedDoc, setPreloadedDoc] = useState<ProcessedDocumentInfo | null>(initialDoc ?? null)
  const [quality, setQuality] = useState<Quality>('medium')
  const [result, setResult] = useState<ProcessedDocumentInfo | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const reset = () => {
    setStage('upload')
    setFile(null)
    setPreloadedDoc(initialDoc ?? null)
    setQuality('medium')
    setResult(null)
    setOriginalSize(0)
    setError(null)
  }

  const handleCompress = async () => {
    if (!preloadedDoc && !file) return
    setStage('processing')
    setError(null)
    try {
      let orig = preloadedDoc ? preloadedDoc.fileSize : file!.size
      if (preloadedDoc && (!orig || orig <= 0)) {
        const meta = await draftsApi.getStandalone(preloadedDoc.id)
        orig = meta.data?.fileSize ?? 0
      }
      setOriginalSize(orig)
      // Use existing doc ID if pre-loaded, otherwise upload the file first
      const documentId = preloadedDoc ? preloadedDoc.id : await uploadToolboxFile(file!)
      const res = await docProcessingApi.compress({ documentId, quality })
      setResult(res.data?.document ?? null)
      setStage('done')
      toast({ title: 'Compression complete' })
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
            <h2 className="text-lg font-serif font-semibold text-kx-primary-900">Compress PDF</h2>
            <p className="text-sm text-ledger-gray-500 mt-0.5">Reduce the file size of a PDF document.</p>
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

                <div className="space-y-2">
                  <Label>Compression quality</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQuality(opt.value)}
                        className={cn(
                          'rounded-lg border px-3 py-2.5 text-left transition-colors',
                          quality === opt.value
                            ? 'border-kx-primary-500 bg-kx-primary-50 dark:bg-kx-primary-950/30'
                            : 'border-kx-card-border hover:border-ledger-gray-300 dark:hover:border-ledger-gray-600'
                        )}
                      >
                        <p className={cn(
                          'text-sm font-medium',
                          quality === opt.value ? 'text-kx-primary-700 dark:text-kx-primary-400' : 'text-kx-primary-900'
                        )}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-ledger-gray-500 mt-0.5">{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button className="w-full" disabled={!hasInput} onClick={handleCompress}>
                  Compress PDF
                </Button>
              </>
            ) : stage === 'processing' ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-kx-primary-500" />
                <p className="text-sm text-kx-primary-900">Compressing your PDF…</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result && (
                  <div className="rounded-lg border border-kx-card-border bg-ledger-gray-50 dark:bg-ledger-gray-800/40 p-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-ledger-gray-500">Original size</span>
                      <span className="text-kx-primary-900">{formatSize(originalSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ledger-gray-500">Compressed size</span>
                      <span className="text-kx-primary-900">{formatSize(result.fileSize)}</span>
                    </div>
                    {originalSize > 0 && result.fileSize < originalSize && (
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-green-600 dark:text-green-400">Saved</span>
                        <span className="text-green-600 dark:text-green-400">
                          {Math.round((1 - result.fileSize / originalSize) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {result && (
                  <Button className="w-full gap-2" disabled={isDownloading} onClick={handleDownload}>
                    {isDownloading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Download className="h-4 w-4" />
                    }
                    Download compressed PDF
                  </Button>
                )}
                <Button variant="ghost" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Compress another file
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

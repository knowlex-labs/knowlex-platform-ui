import { useState, useRef } from 'react'
import { Loader2, Download, RotateCcw, Plus, ArrowLeft, Database, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUploadZone } from './file-upload-zone'
import type { FileUploadZoneHandle } from './file-upload-zone'
import {
  uploadToolboxFile,
  docProcessingApi,
  downloadDocument,
} from '@knowlex/core/api/doc-processing-api'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { ApiError } from '@knowlex/core/api/api-client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ProcessedDocumentInfo } from '@knowlex/core/api/doc-processing-api'

type Stage = 'upload' | 'processing' | 'done' | 'error'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface MergerDialogProps {
  onBack: () => void
  initialDocs?: ProcessedDocumentInfo[]
}

export function MergerDialog({ onBack, initialDocs }: MergerDialogProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [preloadedDocs, setPreloadedDocs] = useState<ProcessedDocumentInfo[]>(initialDocs ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [mergedTitle, setMergedTitle] = useState('')
  const [result, setResult] = useState<ProcessedDocumentInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)

  const fileZoneRef = useRef<FileUploadZoneHandle>(null)
  const totalCount = preloadedDocs.length + files.length

  const reset = () => {
    setStage('upload')
    setPreloadedDocs(initialDocs ?? [])
    setFiles([])
    setMergedTitle('')
    setResult(null)
    setError(null)
  }

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set([
        ...prev.map((f) => f.name),
        ...preloadedDocs.map((d) => d.fileName),
      ])
      const unique = newFiles.filter((f) => !existingNames.has(f.name))
      return [...prev, ...unique].slice(0, 10 - preloadedDocs.length)
    })
  }

  const handleMerge = async () => {
    if (totalCount < 2) return
    setStage('processing')
    setError(null)
    try {
      const uploadedIds = await Promise.all(files.map(f => uploadToolboxFile(f)))
      const documentIds = [...preloadedDocs.map((d) => d.id), ...uploadedIds]
      const res = await docProcessingApi.merge({ documentIds, mergedTitle: mergedTitle.trim() || undefined })
      setResult(res.data?.document ?? null)
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

  const mergeButtonLabel = totalCount < 2 ? 'Add at least 2 PDFs' : `Merge ${totalCount} PDFs`

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
            <h2 className="text-lg font-serif font-semibold text-kx-primary-900">Merge PDFs</h2>
            <p className="text-sm text-ledger-gray-500 mt-0.5">Combine multiple PDF files into one document.</p>
          </div>

          <div className="space-y-4">
            {stage === 'upload' || stage === 'error' ? (
              <>
                {preloadedDocs.length > 0 && (
                  <ul className="space-y-2">
                    {preloadedDocs.map((doc, i) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-3 rounded-lg border border-kx-primary-200 dark:border-kx-primary-800 bg-kx-primary-50 dark:bg-kx-primary-950/20 px-3 py-2"
                      >
                        <Database className="h-4 w-4 flex-shrink-0 text-kx-primary-400" />
                        <span className="flex-1 truncate text-sm text-kx-primary-900">{doc.fileName}</span>
                        <span className="text-xs text-ledger-gray-400 flex-shrink-0">{formatSize(doc.fileSize)}</span>
                        <button
                          type="button"
                          onClick={() => setPreloadedDocs((prev) => prev.filter((_, j) => j !== i))}
                          className={cn('flex-shrink-0 text-xs text-ledger-gray-400 hover:text-red-500 transition-colors px-1')}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <FileUploadZone
                  ref={fileZoneRef}
                  accept=".pdf"
                  multiple
                  label="Drop PDFs here or click to add files"
                  selectedFiles={files}
                  onFilesSelected={addFiles}
                  onRemoveFile={(i) => setFiles((prev) => prev.filter((_, j) => j !== i))}
                />

                {totalCount > 0 && totalCount < 10 && (
                  <button
                    type="button"
                    onClick={() => fileZoneRef.current?.triggerClick()}
                    className="flex items-center gap-1.5 text-sm text-kx-primary-600 hover:text-kx-primary-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add more files
                  </button>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="merged-title">Output filename (optional)</Label>
                  <Input
                    id="merged-title"
                    placeholder="e.g. Full Bundle"
                    value={mergedTitle}
                    onChange={(e) => setMergedTitle(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button className="w-full" disabled={totalCount < 2} onClick={handleMerge}>
                  {mergeButtonLabel}
                </Button>
              </>
            ) : stage === 'processing' ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-kx-primary-500" />
                <p className="text-sm text-kx-primary-900">Uploading and merging your files…</p>
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
                  Merge more files
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

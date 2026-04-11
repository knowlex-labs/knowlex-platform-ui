import { useState } from 'react'
import { Loader2, Download, RotateCcw, Copy, Check, ArrowLeft, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUploadZone } from './file-upload-zone'
import {
  uploadToolboxFile,
  docProcessingApi,
  downloadDocument,
} from '@/services/api/doc-processing-api'
import { ApiError } from '@/services/api/api-client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { markdownToHtml } from '@/lib/markdown-to-html'
import type { ProcessedDocumentInfo, ConvertTargetFormat } from '@/services/api/doc-processing-api'

type Stage = 'upload' | 'processing' | 'done' | 'error'

function getFileType(fileName: string): 'pdf' | 'image' | 'docx' | 'md' | 'other' {
  const name = fileName.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image'
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx'
  if (name.endsWith('.md')) return 'md'
  return 'other'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface FormatOption {
  value: ConvertTargetFormat
  label: string
}

function getFormatOptions(fileType: 'pdf' | 'image' | 'docx' | 'md' | 'other'): FormatOption[] {
  if (fileType === 'pdf') return [
    { value: 'PNG', label: 'PNG images (one per page)' },
    { value: 'JPEG', label: 'JPEG images (one per page)' },
    { value: 'TEXT', label: 'Plain text (extract content)' },
  ]
  if (fileType === 'image') return [
    { value: 'PDF', label: 'PDF document' },
  ]
  if (fileType === 'docx') return [
    { value: 'PDF', label: 'PDF document' },
    { value: 'TEXT', label: 'Plain text (extract content)' },
  ]
  if (fileType === 'md') return [
    { value: 'PDF', label: 'PDF document' },
    { value: 'TEXT', label: 'Plain text' },
  ]
  return []
}

interface ConverterDialogProps {
  onBack: () => void
  initialDoc?: ProcessedDocumentInfo
}

export function ConverterDialog({ onBack, initialDoc }: ConverterDialogProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preloadedDoc, setPreloadedDoc] = useState<ProcessedDocumentInfo | null>(initialDoc ?? null)
  const [targetFormat, setTargetFormat] = useState<ConvertTargetFormat | ''>('')
  const [dpi, setDpi] = useState('150')
  const [resultDocs, setResultDocs] = useState<ProcessedDocumentInfo[]>([])
  const [textContent, setTextContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Derive file type from whichever source is active
  const activeFileName = preloadedDoc?.fileName ?? file?.name ?? ''
  const fileType = activeFileName ? getFileType(activeFileName) : 'other'
  const formatOptions = activeFileName ? getFormatOptions(fileType) : []
  const showDpi = targetFormat === 'PNG' || targetFormat === 'JPEG'

  const reset = () => {
    setStage('upload')
    setFile(null)
    setPreloadedDoc(initialDoc ?? null)
    setTargetFormat('')
    setDpi('150')
    setResultDocs([])
    setTextContent(null)
    setError(null)
    setCopied(false)
  }

  const handleFileSelected = (files: File[]) => {
    setFile(files[0])
    setTargetFormat('')
  }

  const handleConvert = async () => {
    if ((!preloadedDoc && !file) || !targetFormat) return
    setStage('processing')
    setError(null)
    try {
      // Use existing doc ID if pre-loaded, otherwise upload the file first
      const documentId = preloadedDoc ? preloadedDoc.id : await uploadToolboxFile(file!)

      // For MD→PDF: pre-render markdown to styled HTML so the backend
      // produces a formatted document instead of raw markdown text.
      let htmlContent: string | undefined
      if (targetFormat === 'PDF' && fileType === 'md') {
        let markdownSource = ''
        if (file) {
          markdownSource = await file.text()
        } else if (preloadedDoc) {
          // preloaded docs don't carry content — htmlContent stays undefined,
          // backend will fall back to raw text (acceptable for now)
        }
        if (markdownSource) {
          const bodyHtml = markdownToHtml(markdownSource)
          const title = (preloadedDoc?.fileName ?? file?.name ?? 'Document').replace(/\.md$/i, '')
          htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>` +
            `<style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;` +
            `margin:72pt 90pt;color:#000}h1,h2,h3{font-family:inherit;page-break-after:avoid}` +
            `p{margin:0 0 6pt}ul,ol{margin:0 0 6pt;padding-left:24pt}li{margin-bottom:3pt}` +
            `strong{font-weight:bold}em{font-style:italic}</style></head>` +
            `<body>${bodyHtml}</body></html>`
        }
      }

      const res = await docProcessingApi.convert({
        documentId,
        targetFormat,
        dpi: showDpi ? Number(dpi) || 150 : undefined,
        htmlContent,
      })
      setResultDocs(res.data?.documents ?? [])
      setTextContent(res.data?.textContent ?? null)
      setStage('done')
      if (targetFormat !== 'TEXT') {
        toast({ title: 'Conversion complete' })
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
      setStage('error')
    }
  }

  const handleCopy = () => {
    if (!textContent) return
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = async (doc: ProcessedDocumentInfo) => {
    setDownloadingId(doc.id)
    try {
      await downloadDocument(doc.downloadUrl ?? doc.id, doc.fileName)
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' })
    } finally {
      setDownloadingId(null)
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
            <h2 className="text-lg font-serif font-semibold text-kx-primary-900">Convert Document</h2>
            <p className="text-sm text-ledger-gray-500 mt-0.5">Convert between PDF, images, and plain text.</p>
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
                        onClick={() => { setPreloadedDoc(null); setTargetFormat('') }}
                        className="flex-shrink-0 rounded p-0.5 text-ledger-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <FileUploadZone
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.md"
                    label="Drop a PDF, image, DOCX, or Markdown file here, or click to browse"
                    selectedFiles={file ? [file] : []}
                    onFilesSelected={handleFileSelected}
                    onRemoveFile={() => { setFile(null); setTargetFormat('') }}
                  />
                )}

                {hasInput && formatOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Convert to</Label>
                    <div className="space-y-2">
                      {formatOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                            targetFormat === opt.value
                              ? 'border-kx-primary-500 bg-kx-primary-50 dark:bg-kx-primary-950/30'
                              : 'border-kx-card-border hover:border-ledger-gray-300'
                          )}
                        >
                          <input
                            type="radio"
                            name="target-format"
                            value={opt.value}
                            checked={targetFormat === opt.value}
                            onChange={() => setTargetFormat(opt.value)}
                            className="accent-kx-primary-600"
                          />
                          <span className="text-sm text-kx-primary-900">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {showDpi && (
                  <div className="space-y-1.5">
                    <Label htmlFor="dpi">Resolution (DPI)</Label>
                    <Input
                      id="dpi"
                      type="number"
                      min="72"
                      max="600"
                      value={dpi}
                      onChange={(e) => setDpi(e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button className="w-full" disabled={!hasInput || !targetFormat} onClick={handleConvert}>
                  Convert
                </Button>
              </>
            ) : stage === 'processing' ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-kx-primary-500" />
                <p className="text-sm text-kx-primary-900">Converting your file…</p>
              </div>
            ) : textContent !== null ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-kx-primary-900">Extracted text</p>
                  <Button size="sm" variant="ghost" className="gap-1.5 h-7" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <pre className="max-h-72 overflow-y-auto rounded-lg border border-kx-card-border bg-ledger-gray-50 dark:bg-ledger-gray-800/40 p-3 text-xs text-kx-primary-900 whitespace-pre-wrap break-words">
                  {textContent || '(No text content found)'}
                </pre>
                <Button variant="ghost" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Convert another file
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-kx-primary-900">
                  {resultDocs.length} file{resultDocs.length !== 1 ? 's' : ''} ready to download.
                </p>
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {resultDocs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-kx-card-border bg-ledger-gray-50 dark:bg-ledger-gray-800/40 px-3 py-2"
                    >
                      <span className="truncate text-sm text-kx-primary-900">{doc.fileName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 flex-shrink-0"
                        disabled={downloadingId === doc.id}
                        onClick={() => handleDownload(doc)}
                      >
                        {downloadingId === doc.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Download className="h-3.5 w-3.5" />
                        }
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Convert another file
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

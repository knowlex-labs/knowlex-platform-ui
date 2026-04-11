import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle, Download, RotateCcw, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { caseApi } from '@/services/api/case-api'
import {
  submitTranslation,
  getTranslationStatus,
  triggerDirectDownload,
  fetchDocumentBlob,
  type ProcessedDocumentInfo,
} from '@/services/api/doc-processing-api'
import { toast } from '@/hooks/use-toast'

function formatSize(bytes: number) {
  if (bytes <= 0) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Bengali',
  'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi',
]

type Stage = 'upload' | 'processing' | 'done' | 'error'

interface TranslationDialogProps {
  onBack: () => void
  /** Workspace document selected when opening Translate from the tools panel */
  initialDoc?: ProcessedDocumentInfo
}

export function TranslationDialog({ onBack, initialDoc }: TranslationDialogProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preloadedDoc, setPreloadedDoc] = useState<ProcessedDocumentInfo | null>(initialDoc ?? null)
  const [targetLang, setTargetLang] = useState('Hindi')
  const [sourceLang, setSourceLang] = useState('')
  const [caseId, setCaseId] = useState('')
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jobIdRef = useRef<string | null>(null)

  useEffect(() => {
    caseApi.getAll({ size: 50 }).then(res => {
      setCases((res.data?.content ?? []).map(c => ({
        id: c.id,
        label: c.title || c.caseNumber || c.id,
      })))
    }).catch(() => {})
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const startPolling = (jobId: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const status = await getTranslationStatus(jobId)
        if (status.status === 'completed') {
          stopPolling()
          setSignedUrl(status.signed_url)
          setStage('done')
        } else if (status.status === 'failed') {
          stopPolling()
          setErrorMsg(status.error ?? 'Translation failed')
          setStage('error')
        }
      } catch {
        // transient error — keep polling
      }
    }, 4000)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const handleSubmit = async () => {
    if (!file) return
    setIsSubmitting(true)
    try {
      const job = await submitTranslation(file, targetLang, {
        sourceLanguage: sourceLang || undefined,
        caseId: caseId || undefined,
      })
      jobIdRef.current = job.job_id
      setStage('processing')
      startPolling(job.job_id)
    } catch (e) {
      toast({
        title: 'Submission failed',
        description: e instanceof Error ? e.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    stopPolling()
    setStage('upload')
    setFile(null)
    setSignedUrl(null)
    setErrorMsg(null)
    jobIdRef.current = null
  }

  const downloadFileName = file
    ? `${file.name.replace(/\.[^.]+$/, '')}_${targetLang.toLowerCase()}.pdf`
    : `translated_${targetLang.toLowerCase()}.pdf`

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

      <div className="mt-4 max-w-xl mx-auto">
        {/* Upload stage */}
        {stage === 'upload' && (
          <div className="bg-kx-card border border-kx-card-border rounded-xl shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-kx-primary-900">Translate Document</h2>
              <p className="text-sm text-ledger-gray-500 mt-0.5">Upload a PDF, DOCX, or TXT file to translate</p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-kx-primary-400 bg-kx-primary-50 dark:bg-kx-primary-950/20'
                  : 'border-kx-card-border hover:border-kx-primary-300 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/40'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-5 w-5 text-kx-primary-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-kx-text-primary truncate max-w-xs">{file.name}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="text-ledger-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 mx-auto mb-2 text-ledger-gray-400" />
                  <p className="text-sm font-medium text-kx-text-primary">Drop file here or click to browse</p>
                  <p className="text-xs text-ledger-gray-400 mt-1">PDF, DOCX, TXT — max 50 MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
              />
            </div>

            {/* Language selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Target Language</label>
                <Select value={targetLang} onChange={e => setTargetLang(e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Source Language <span className="text-ledger-gray-400">(optional)</span></label>
                <Select value={sourceLang} onChange={e => setSourceLang(e.target.value)}>
                  <option value="">Auto-detect</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
              </div>
            </div>

            {/* Case selector */}
            <div>
              <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Save to Case <span className="text-ledger-gray-400">(optional)</span></label>
              <Select value={caseId} onChange={e => setCaseId(e.target.value)} searchable searchPlaceholder="Search cases…">
                <option value="">Standalone</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </div>

            <Button
              className="w-full gap-2"
              disabled={!file || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Upload className="h-4 w-4" />
              }
              {isSubmitting ? 'Submitting…' : 'Translate'}
            </Button>
          </div>
        )}

        {/* Processing stage */}
        {stage === 'processing' && (
          <div className="bg-kx-card border border-kx-card-border rounded-xl shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-kx-primary-500" />
            <p className="text-base font-semibold text-kx-primary-900">Translating to {targetLang}…</p>
            <p className="text-sm text-ledger-gray-500">This may take a minute. Please wait.</p>
          </div>
        )}

        {/* Done stage */}
        {stage === 'done' && (
          <div className="bg-kx-card border border-kx-card-border rounded-xl shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
            <p className="text-base font-semibold text-kx-primary-900">Translation complete</p>
            <p className="text-sm text-ledger-gray-500">Your document has been translated to {targetLang}.</p>
            {signedUrl && (
              <Button
                className="gap-2 px-6"
                onClick={() => triggerDirectDownload(signedUrl, downloadFileName)}
              >
                <Download className="h-4 w-4" />
                Download Translated Document
              </Button>
            )}
            <Button variant="ghost" className="gap-1.5 text-sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Translate another
            </Button>
          </div>
        )}

        {/* Error stage */}
        {stage === 'error' && (
          <div className="bg-kx-card border border-kx-card-border rounded-xl shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-base font-semibold text-kx-primary-900">Translation failed</p>
            <p className="text-sm text-ledger-gray-500">{errorMsg ?? 'Something went wrong. Please try again.'}</p>
            <Button variant="ghost" className="gap-1.5" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

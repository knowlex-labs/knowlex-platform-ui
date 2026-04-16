import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle, Download, RotateCcw, FileText, X, Eye, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { caseApi } from '@knowlex/core/api/case-api'
import {
  submitTranslation,
  getDocument,
  triggerDirectDownload,
  uploadToolboxFile,
  type ProcessedDocumentInfo,
} from '@knowlex/core/api/doc-processing-api'
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
  onJobStarted?: (jobId: string, targetLang: string) => void
  /** Workspace document selected when opening Translate from the tools panel */
  initialDoc?: ProcessedDocumentInfo
}

export function TranslationDialog({ onBack, onJobStarted, initialDoc }: TranslationDialogProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preloadedDoc, setPreloadedDoc] = useState<ProcessedDocumentInfo | null>(initialDoc ?? null)
  const [targetLang, setTargetLang] = useState('Hindi')
  const [sourceLang, setSourceLang] = useState('')
  const [model, setModel] = useState('gemini')
  const [caseId, setCaseId] = useState('')
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jobIdRef = useRef<string | null>(null)

  useEffect(() => {
    setPreloadedDoc(initialDoc ?? null)
    setFile(null)
  }, [initialDoc])

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

  const startPolling = (documentId: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const doc = await getDocument(documentId)
        if (doc.jobStatus === 'COMPLETED') {
          stopPolling()
          setSignedUrl(doc.storageUrl ?? doc.signedUrl ?? doc.downloadUrl)
          setStage('done')
        } else if (doc.jobStatus === 'FAILED' || doc.jobStatus === 'CANCELLED') {
          stopPolling()
          setErrorMsg('Translation failed')
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
    if (dropped) {
      setFile(dropped)
      setPreloadedDoc(null)
    }
  }

  const handleSubmit = async () => {
    let docId: string | null = null

    if (preloadedDoc && !file) {
      // Existing document from workspace — use its id directly
      docId = preloadedDoc.id
    } else if (file) {
      // New file picked by user — upload it first to obtain a doc_id
      setIsUploading(true)
      try {
        docId = await uploadToolboxFile(file, { caseId: caseId || undefined })
      } catch (e) {
        toast({
          title: 'Upload failed',
          description: e instanceof Error ? e.message : 'Please try again',
          variant: 'destructive',
        })
        return
      } finally {
        setIsUploading(false)
      }
    }

    if (!docId) return

    setIsSubmitting(true)
    try {
      const doc = await submitTranslation(docId, targetLang, {
        sourceLanguage: sourceLang || undefined,
        model,
      })
      jobIdRef.current = doc.jobId ?? doc.id
      if (onJobStarted) {
        onJobStarted(doc.id, targetLang)
        toast({ title: `Translating to ${targetLang}…`, description: 'We\'ll notify you when it\'s ready.' })
        onBack()
      } else {
        setStage('processing')
        startPolling(doc.id)
      }
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

  const handleView = () => {
    if (!signedUrl) return
    window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}`, '_blank')
  }

  const handleSave = async () => {
    if (!signedUrl) return
    setIsSaving(true)
    try {
      const res = await fetch(signedUrl)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const savedFile = new File([blob], downloadFileName, { type: blob.type })
      const fileType = blob.type.includes('pdf') ? 'PDF' : 'DOCX'
      await uploadToolboxFile(savedFile, { caseId: caseId || undefined, fileType })
      setIsSaved(true)
      toast({ title: 'Saved to Documents' })
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const reset = () => {
    stopPolling()
    setStage('upload')
    setFile(null)
    setPreloadedDoc(initialDoc ?? null)
    setSignedUrl(null)
    setErrorMsg(null)
    setIsUploading(false)
    setIsSubmitting(false)
    setIsSaving(false)
    setIsSaved(false)
    setModel('gemini')
    jobIdRef.current = null
  }

  const sourceLabel = file?.name ?? preloadedDoc?.fileName ?? ''
  const downloadFileName = sourceLabel
    ? `${sourceLabel.replace(/\.[^.]+$/, '')}_${targetLang.toLowerCase()}.pdf`
    : `translated_${targetLang.toLowerCase()}.pdf`

  const hasSource = file !== null || preloadedDoc !== null

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

            {/* Selected workspace doc or upload */}
            {preloadedDoc && !file ? (
              <div className="flex items-center gap-3 rounded-lg border border-kx-primary-200 dark:border-kx-primary-800 bg-kx-primary-50 dark:bg-kx-primary-950/20 px-3 py-2.5">
                <FileText className="h-4 w-4 flex-shrink-0 text-kx-primary-500" />
                <span className="flex-1 truncate text-sm font-medium text-kx-primary-900">{preloadedDoc.fileName}</span>
                {preloadedDoc.fileSize > 0 && (
                  <span className="text-xs text-ledger-gray-400 flex-shrink-0">{formatSize(preloadedDoc.fileSize)}</span>
                )}
                <button
                  type="button"
                  onClick={() => setPreloadedDoc(null)}
                  className="flex-shrink-0 rounded p-0.5 text-ledger-gray-400 hover:text-red-500 transition-colors"
                  title="Remove and upload a different file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
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
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setFile(f)
                      setPreloadedDoc(null)
                    }
                  }}
                />
              </div>
            )}

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

            {/* Model selector */}
            <div>
              <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">AI Model <span className="text-ledger-gray-400">(optional)</span></label>
              <Select value={model} onChange={e => setModel(e.target.value)}>
                <option value="gemini">Gemini</option>
                <option value="openai">GPT (OpenAI)</option>
              </Select>
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
              disabled={!hasSource || isSubmitting || isUploading}
              onClick={handleSubmit}
            >
              {isSubmitting || isUploading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Upload className="h-4 w-4" />
              }
              {isUploading ? 'Uploading…' : isSubmitting ? 'Submitting…' : 'Translate'}
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
              <>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2 px-5" onClick={handleView}>
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button className="gap-2 px-5" onClick={() => triggerDirectDownload(signedUrl, downloadFileName)}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="gap-2 px-5" disabled={isSaving || isSaved} onClick={handleSave}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-ledger-gray-400">
                  Saves to {cases.find(c => c.id === caseId)?.label ?? 'Standalone Documents'}
                </p>
              </>
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

import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { Upload, FileText, X, ChevronDown, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { caseApi } from '@knowlex/core/api/case-api'
import { formatCaseFolderLabel } from '@knowlex/core/utils'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import {
  submitTranslation,
  uploadToolboxFile,
  type DocumentRecord,
} from '@knowlex/core/api/doc-processing-api'
import type { CaseDocument } from '@knowlex/core/types'
import { toast } from '@/hooks/use-toast'

const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Bengali',
  'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi',
]

type SourceTab = 'upload' | 'case'

export interface TranslationJobInfo {
  translatedDocId: string
  sourceDocId: string
  sourceFileName: string
  targetLang: string
}

interface TranslationWorkspaceProps {
  onJobStarted: (info: TranslationJobInfo) => void
}

function formatSize(bytes: number) {
  if (bytes <= 0) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TranslationWorkspace({ onJobStarted }: TranslationWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<SourceTab>('upload')

  // Upload tab state
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [saveToCaseId, setSaveToCaseId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Case tab state
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [caseFiles, setCaseFiles] = useState<CaseDocument[]>([])
  const [selectedFileId, setSelectedFileId] = useState('')
  const [isFetchingFiles, setIsFetchingFiles] = useState(false)
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false)
  const fileDropdownRef = useRef<HTMLDivElement>(null)

  // Shared state
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])
  const [targetLang, setTargetLang] = useState('Hindi')
  const [sourceLang, setSourceLang] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    caseApi.getAll({ size: 50 }).then(res => {
      setCases((res.data?.content ?? []).map(c => ({
        id: c.id,
        label: formatCaseFolderLabel(c),
      })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCaseId) { setCaseFiles([]); setSelectedFileId(''); return }
    setIsFetchingFiles(true)
    workspaceApi.getCaseDocuments(selectedCaseId, 'USER_UPLOADED')
      .then(docs => { setCaseFiles(docs); setSelectedFileId('') })
      .catch(() => { toast({ title: 'Could not load case files', variant: 'destructive' }) })
      .finally(() => setIsFetchingFiles(false))
  }, [selectedCaseId])

  useEffect(() => {
    if (!fileDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (fileDropdownRef.current && !fileDropdownRef.current.contains(e.target as Node)) {
        setFileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [fileDropdownOpen])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    let sourceDocId: string | null = null
    let sourceFileName = ''

    try {
      if (activeTab === 'upload' && file) {
        setIsUploading(true)
        try {
          sourceDocId = await uploadToolboxFile(file, { caseId: saveToCaseId || undefined })
          sourceFileName = file.name
        } finally {
          setIsUploading(false)
        }
        const result: DocumentRecord = await submitTranslation(sourceDocId!, targetLang, {
          sourceLanguage: sourceLang || undefined,
          caseId: saveToCaseId || '',
        })
        onJobStarted({ translatedDocId: result.id, sourceDocId: sourceDocId!, sourceFileName, targetLang })
        return
      } else if (activeTab === 'case' && selectedFileId) {
        const selectedFile = caseFiles.find(f => f.id === selectedFileId)
        sourceDocId = selectedFileId
        sourceFileName = selectedFile?.originalFilename ?? selectedFile?.name ?? ''
      }

      if (!sourceDocId) { setIsSubmitting(false); return }

      const result: DocumentRecord = await submitTranslation(sourceDocId, targetLang, {
        sourceLanguage: sourceLang || undefined,
        caseId: selectedCaseId || undefined,
      })

      onJobStarted({ translatedDocId: result.id, sourceDocId, sourceFileName, targetLang })
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

  const canSubmit = activeTab === 'upload' ? file !== null : selectedFileId !== ''

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-kx-text-primary">Translate Document</h1>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Upload a file or pick one from a case to translate
          </p>
        </div>

        {/* Source tabs */}
        <div className="flex rounded-lg border border-kx-card-border bg-kx-surface p-1 gap-1">
          {(['upload', 'case'] as SourceTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-kx-card shadow-sm text-kx-text-primary'
                  : 'text-ledger-gray-500 hover:text-kx-text-primary',
              )}
            >
              {tab === 'upload' ? 'Upload File' : 'From Case'}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDragging
                  ? 'border-teal-400 bg-teal-50 dark:bg-teal-950/20'
                  : 'border-kx-card-border hover:border-teal-300 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/40',
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-kx-text-primary truncate max-w-xs">{file.name}</span>
                  {file.size > 0 && (
                    <span className="text-xs text-ledger-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
                  )}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0]
                  if (f) setFile(f)
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">
                Save to Case <span className="text-ledger-gray-400">(optional)</span>
              </label>
              <Select value={saveToCaseId} onChange={e => setSaveToCaseId(e.target.value)} searchable searchPlaceholder="Search cases…">
                <option value="">Standalone</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </div>
          </div>
        )}

        {/* Case tab */}
        {activeTab === 'case' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Case</label>
              <Select
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
                searchable
                searchPlaceholder="Search cases…"
              >
                <option value="">Select a case…</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </div>

            {selectedCaseId && (
              <div>
                <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">File</label>
                {isFetchingFiles ? (
                  <div className="flex items-center gap-2 text-sm text-ledger-gray-400 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading files…
                  </div>
                ) : caseFiles.length === 0 ? (
                  <p className="text-sm text-ledger-gray-400 italic py-2">No files in this case yet.</p>
                ) : (
                  <div ref={fileDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setFileDropdownOpen(o => !o)}
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 px-3 text-sm text-kx-primary-900 dark:text-ledger-gray-200 hover:border-ledger-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    >
                      <span className="truncate text-left">
                        {selectedFileId
                          ? caseFiles.find(f => f.id === selectedFileId)?.originalFilename
                            ?? caseFiles.find(f => f.id === selectedFileId)?.name
                            ?? 'Selected'
                          : <span className="text-ledger-gray-400">Select a file…</span>
                        }
                      </span>
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-ledger-gray-400 transition-transform', fileDropdownOpen && 'rotate-180')} />
                    </button>
                    {fileDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 shadow-xl max-h-52 overflow-y-auto">
                        {caseFiles.map(doc => {
                          const label = doc.originalFilename || doc.name
                          const isSelected = doc.id === selectedFileId
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => { setSelectedFileId(doc.id); setFileDropdownOpen(false) }}
                              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-700 text-left"
                            >
                              <div className={cn(
                                'h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors',
                                isSelected
                                  ? 'bg-teal-600 border-teal-600 text-white'
                                  : 'border-ledger-gray-300 dark:border-ledger-gray-500 bg-white dark:bg-ledger-gray-700',
                              )}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span className="text-sm text-kx-primary-900 dark:text-ledger-gray-200 truncate">{label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
            <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">
              Source Language <span className="text-ledger-gray-400">(optional)</span>
            </label>
            <Select value={sourceLang} onChange={e => setSourceLang(e.target.value)}>
              <option value="">Auto-detect</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
        </div>

        <Button
          className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          disabled={!canSubmit || isSubmitting || isUploading}
          onClick={handleSubmit}
        >
          {isSubmitting || isUploading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Upload className="h-4 w-4" />
          }
          {isUploading ? 'Uploading…' : isSubmitting ? 'Submitting…' : 'Translate'}
        </Button>
      </div>
    </div>
  )
}

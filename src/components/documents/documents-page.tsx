import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Upload, Scissors, Minimize2, Layers,
  FileText, File, MoreVertical, Download, FolderInput,
  Trash2, Loader2, PenLine, Languages, Scale,
  BookOpen, X, Search, SlidersHorizontal, Settings2,
  ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import {
  listAllDocuments,
  uploadToolboxFile,
  downloadDocument,
  triggerDirectDownload,
  type DocumentRecordType,
} from '@/services/api/doc-processing-api'
import { workspaceApi } from '@/services/api/workspace-api'
import { config } from '@/config/env'
import { caseApi } from '@/services/api/case-api'
import { apiClient, ApiError } from '@/services/api/api-client'
import { OnlyOfficeEditor } from '@/components/cases/case-workspace/onlyoffice-editor'
import { toast } from '@/hooks/use-toast'
import { renderDraftToHtml } from '@/lib/draft-renderer'
import { useEditorFormatting } from '@/hooks/use-editor-formatting'
import { FormattingToolbar } from '@/components/cases/case-workspace/formatting-toolbar'
import { SplitterDialog } from '@/components/toolbox/splitter-dialog'
import { MergerDialog } from '@/components/toolbox/merger-dialog'
import { ConverterDialog } from '@/components/toolbox/converter-dialog'
import { CompressorDialog } from '@/components/toolbox/compressor-dialog'
import { TranslationDialog } from '@/components/toolbox/translation-dialog'
import { AssignCaseDialog } from './assign-case-dialog'
import { useUIState } from '@/contexts/ui-context'
import { useSearchParams } from 'react-router-dom'
import type {
  DocumentRecord,
  ProcessedDocumentInfo,
} from '@/services/api/doc-processing-api'
import { DocumentType, JobStatus, GENERATED_DOC_TYPES } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveToolId = null | 'split' | 'merge' | 'convert' | 'compress' | 'translation'
type DocRowAction = 'download' | 'assign' | 'split' | 'convert' | 'compress' | 'translate' | 'delete'

interface ToolContext {
  id: ActiveToolId
  initialDoc?: ProcessedDocumentInfo
  initialDocs?: ProcessedDocumentInfo[]
}

const PAGE_SIZE = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatSize(bytes?: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toProcessedDoc(doc: DocumentRecord): ProcessedDocumentInfo {
  return {
    id: doc.id,
    fileName: doc.originalFilename || doc.name,
    fileSize: doc.fileSize ?? 0,
    pageCount: 0,
    downloadUrl: doc.downloadUrl ?? undefined,
  }
}

// ─── File icon ────────────────────────────────────────────────────────────────

function FileIcon({ fileType, className }: { fileType?: string | null; className?: string }) {
  const isPdf = fileType === 'PDF'
  const isDocx = fileType === 'DOCX' || fileType === 'DOC'
  return (
    <div className={cn(
      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold',
      isPdf ? 'bg-red-500' : isDocx ? 'bg-blue-500' : 'bg-ledger-gray-400',
      className,
    )}>
      {isPdf ? 'PDF' : isDocx ? 'DOC' : <File className="h-4 w-4" />}
    </div>
  )
}

// ─── Type metadata ────────────────────────────────────────────────────────────

const TYPE_META: Record<DocumentType, {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  [DocumentType.USER_UPLOADED]: { label: 'Uploaded', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: File },
  [DocumentType.DRAFT]:         { label: 'Draft',    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: PenLine },
  [DocumentType.SUMMARY]:       { label: 'Summary',  className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: FileText },
  [DocumentType.JUDGMENT]:      { label: 'Judgment', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Scale },
  [DocumentType.BRIEF]:         { label: 'Brief',    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: FileText },
}

// ─── Tools config ─────────────────────────────────────────────────────────────

const TOOLS: { id: Exclude<ActiveToolId, null>; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'merge',       label: 'Merge',     icon: Layers },
  { id: 'split',       label: 'Split',     icon: Scissors },
  { id: 'translation', label: 'Translate', icon: Languages },
  { id: 'compress',    label: 'Compress',  icon: Minimize2 },
  { id: 'convert',     label: 'Convert',   icon: BookOpen },
]

// ─── DocTableRow ──────────────────────────────────────────────────────────────

function DocTableRow({
  doc, selected, onSelect, onAction, checked, onCheck, compact,
}: {
  doc: DocumentRecord
  selected: boolean
  onSelect: () => void
  onAction: (action: DocRowAction) => void
  checked: boolean
  onCheck: (checked: boolean) => void
  compact?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const displayName = doc.originalFilename || doc.name
  const caseLabel = doc.caseTitle
  const isStandalone = !doc.caseId
  const isPdf = doc.fileType === 'PDF'
  const canDownload = !!(doc.downloadUrl || doc.storageUrl)
  const isUpload = doc.type === DocumentType.USER_UPLOADED
  const isGenerating = GENERATED_DOC_TYPES.has(doc.type) && doc.jobStatus === JobStatus.PROCESSING
  const isGenFailed   = GENERATED_DOC_TYPES.has(doc.type) && doc.jobStatus === JobStatus.FAILED

  const menuItems: { label: string; icon: React.ComponentType<{ className?: string }>; action: DocRowAction; danger?: boolean }[] = isGenerating ? [] : [
    ...(canDownload ? [{ label: 'Download', icon: Download, action: 'download' as const }] : []),
    ...(isUpload && isStandalone ? [{ label: 'Assign to Case', icon: FolderInput, action: 'assign' as const }] : []),
    ...(isUpload && isPdf ? [{ label: 'Split', icon: Scissors, action: 'split' as const }, { label: 'Compress', icon: Minimize2, action: 'compress' as const }] : []),
    ...(isUpload ? [{ label: 'Convert / OCR', icon: BookOpen, action: 'convert' as const }] : []),
    { label: 'Translate', icon: Languages, action: 'translate' as const },
    ...(isUpload ? [{ label: 'Delete', icon: Trash2, action: 'delete' as const, danger: true }] : []),
  ]

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group grid items-center gap-4 px-4 py-3 border-b border-ledger-gray-100 dark:border-ledger-gray-800',
        'cursor-pointer transition-colors last:border-0',
        compact
          ? 'grid-cols-[20px_36px_1fr_28px]'
          : 'grid-cols-[28px_40px_1fr_180px_130px]',
        selected
          ? 'bg-kx-primary-50 dark:bg-kx-primary-950/20 border-l-2 border-l-kx-primary-500'
          : checked
            ? 'bg-kx-primary-50/50'
            : 'hover:bg-ledger-gray-50/70 dark:hover:bg-ledger-gray-800/40'
      )}
    >
      {/* Checkbox */}
      <div onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onCheck(!checked)}
          className={cn(
            'h-4 w-4 rounded border flex items-center justify-center transition-colors flex-shrink-0',
            checked
              ? 'bg-kx-primary-600 border-kx-primary-600 text-white'
              : 'border-ledger-gray-300 dark:border-ledger-gray-600 hover:border-kx-primary-400'
          )}
        >
          {checked && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* File icon */}
      <FileIcon fileType={doc.fileType} />

      {/* Name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-medium text-kx-text-primary leading-none">
            {displayName}
          </span>
          {isGenerating && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-kx-primary-600 bg-kx-primary-50 dark:bg-kx-primary-950/40 dark:text-kx-primary-400 px-1.5 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-kx-primary-500 animate-pulse" />
              Generating
            </span>
          )}
          {isGenFailed && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded-full">
              Failed
            </span>
          )}
        </div>
        {compact && caseLabel && (
          <span className="text-[11px] text-ledger-gray-400 truncate block mt-0.5">{caseLabel}</span>
        )}
      </div>

      {!compact && (
        <>
          {/* Case badge */}
          <div className="min-w-0">
            {isStandalone ? (
              <span className="text-xs text-ledger-gray-400 italic">Standalone</span>
            ) : (
              <span className="inline-block truncate max-w-full text-xs px-2 py-0.5 rounded bg-ledger-gray-100 dark:bg-ledger-gray-800 text-ledger-gray-600 dark:text-ledger-gray-300">
                {caseLabel}
              </span>
            )}
          </div>

          {/* Date */}
          <span className="text-sm text-ledger-gray-400 tabular-nums">
            {formatDate(doc.createdAt)}
          </span>

        </>
      )}
    </div>
  )
}

// ─── DocumentViewer ───────────────────────────────────────────────────────────

function DocumentViewer({
  doc, onClose, onOpenTool: _onOpenTool,
}: {
  doc: DocumentRecord
  onClose: () => void
  onOpenTool: (id: ActiveToolId, ctx?: Omit<ToolContext, 'id'>) => void
}) {
  const [viewerMode, setViewerMode] = useState<'view' | 'text-edit'>('view')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [rawTextEdit, setRawTextEdit] = useState('')
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [onlyOfficeOpen, setOnlyOfficeOpen] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const formatting = useEditorFormatting(editorRef, () => setIsDirty(true))

  const displayName = doc.originalFilename || doc.name
  const meta = TYPE_META[doc.type]
  const Icon = meta.icon
  const isTextual = GENERATED_DOC_TYPES.has(doc.type)
  const isPdf = doc.fileType === 'PDF'
  const isImage = !isPdf && /\.(png|jpe?g)$/i.test(doc.name)
  const isDraft = doc.type === DocumentType.DRAFT
  const isMarkdownOrText = doc.type === DocumentType.USER_UPLOADED && /\.(md|txt)$/i.test(displayName)

  const canDownload = !!(doc.downloadUrl || doc.storageUrl)
  const isGenerating = isTextual && doc.jobStatus === JobStatus.PROCESSING
  const isGenFailed  = isTextual && doc.jobStatus === JobStatus.FAILED

  useEffect(() => {
    let cancelled = false
    setBlobUrl(null)
    setTextContent(null)
    setRawTextEdit('')
    setViewerMode('view')
    setIsDirty(false)
    setOnlyOfficeOpen(false)
    setIsLoadingContent(true)

    // Don't attempt to load content for documents still being generated
    if (isGenerating || isGenFailed) {
      setIsLoadingContent(false)
      return
    }

    async function load() {
      try {
        if (isMarkdownOrText) {
          const token = localStorage.getItem('auth_token')
          const userId = localStorage.getItem('auth_user_id')
          const headers: Record<string, string> = {}
          if (token) headers['Authorization'] = `Bearer ${token}`
          if (userId) headers['x-user-id'] = userId
          const res = await fetch(`${config.apiBaseUrl}/api/v1/documents/${doc.id}/content`, { headers })
          if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`)
          if (!cancelled) setTextContent(await res.text())
        } else if (isTextual) {
          const text = await workspaceApi.fetchDocumentContent({ id: doc.id, signedUrl: doc.storageUrl, downloadUrl: doc.downloadUrl })
          if (!cancelled) setTextContent(text)
        } else {
          const url = await workspaceApi.resolveDocumentUrl({ id: doc.id, downloadUrl: doc.downloadUrl, signedUrl: doc.storageUrl })
          if (!cancelled) setBlobUrl(url)
        }
      } catch {
        if (!cancelled) toast({ title: 'Failed to load document', variant: 'destructive' })
      } finally {
        if (!cancelled) setIsLoadingContent(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [doc.id, doc.downloadUrl, doc.storageUrl, isTextual, isMarkdownOrText, isGenerating, isGenFailed])

  useEffect(() => { return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) } }, [blobUrl])

  const handleEdit = () => {
    if (isMarkdownOrText && textContent !== null) {
      setRawTextEdit(textContent)
      setViewerMode('text-edit')
    } else if (isDraft && textContent !== null) {
      if (editorRef.current) editorRef.current.innerHTML = renderDraftToHtml(textContent)
      setViewerMode('text-edit')
    } else {
      setOnlyOfficeOpen(true)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (isMarkdownOrText) {
        const token = localStorage.getItem('auth_token')
        const userId = localStorage.getItem('auth_user_id')
        const headers: Record<string, string> = { 'Content-Type': 'text/plain' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (userId) headers['x-user-id'] = userId
        const res = await fetch(`${config.apiBaseUrl}/api/v1/documents/${doc.id}/content`, {
          method: 'PUT', headers, body: rawTextEdit,
        })
        if (!res.ok) throw new Error()
        setTextContent(rawTextEdit)
      } else {
        if (!editorRef.current) return
        await apiClient.put(`/api/v1/documents/${doc.id}/content`, { content: editorRef.current.innerHTML })
      }
      setIsDirty(false)
      toast({ title: 'Saved' })
    } catch { toast({ title: 'Save failed', variant: 'destructive' }) }
    finally { setIsSaving(false) }
  }

  const handleCancelEdit = () => { setViewerMode('view'); setIsDirty(false) }

  const handleDownload = async () => {
    try {
      if (doc.downloadUrl) await downloadDocument(doc.downloadUrl, displayName)
      else if (doc.storageUrl) triggerDirectDownload(doc.storageUrl, displayName)
    } catch { toast({ title: 'Download failed', variant: 'destructive' }) }
  }

  return (
    <div className="flex flex-col h-full border-l border-kx-card-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-kx-card-border flex-shrink-0">
        <button type="button" onClick={onClose} className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <FileIcon fileType={doc.fileType} className="h-6 w-6 text-xs" />
        <span className="flex-1 min-w-0 text-sm font-medium text-kx-text-primary truncate">{displayName}</span>
        <span className={cn('flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', meta.className)}>
          {meta.label}
        </span>
        {doc.type === DocumentType.USER_UPLOADED && viewerMode === 'view' && (
          <Button size="sm" onClick={handleEdit} className="gap-1.5 h-7 text-xs flex-shrink-0">
            <PenLine className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        {canDownload && viewerMode === 'view' && (
          <button type="button" onClick={handleDownload} title="Download" className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      {isDraft && (
        <FormattingToolbar
          isEditing={viewerMode === 'text-edit'} onEdit={handleEdit} onSave={handleSave} onCancel={handleCancelEdit}
          onBold={formatting.handleBold} onItalic={formatting.handleItalic} onUnderline={formatting.handleUnderline}
          onAlignLeft={formatting.handleAlignLeft} onAlignCenter={formatting.handleAlignCenter} onAlignRight={formatting.handleAlignRight}
          onBulletList={formatting.handleBulletList} onNumberedList={formatting.handleNumberedList} onFontSize={formatting.handleFontSize}
          isSaving={isSaving} hasChanges={isDirty}
        />
      )}
      {isMarkdownOrText && viewerMode === 'text-edit' && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-kx-card-border flex-shrink-0 bg-nb-panel">
          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty} className="h-7 text-xs gap-1.5">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Save
          </Button>
          <button type="button" onClick={handleCancelEdit} className="h-7 px-2 text-xs text-ledger-gray-500 hover:text-kx-text-primary transition-colors">
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto relative">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <div className="flex items-center gap-2 bg-kx-primary-700/90 text-white text-xs px-4 py-1.5 rounded-full font-medium select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white/90" />
              </span>
              Generating {meta.label} — this usually takes 1-2 minutes
            </div>
            <div className="w-full max-w-sm space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-24 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                  {[100, 88, 75].map((w, j) => (
                    <div key={j} className="h-2.5 rounded bg-ledger-gray-100 dark:bg-ledger-gray-800 animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : isGenFailed ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium text-kx-text-primary">{meta.label} generation failed</p>
            <p className="text-xs text-ledger-gray-400 max-w-xs">This {meta.label.toLowerCase()} could not be generated. Please try creating it again.</p>
          </div>
        ) : isLoadingContent ? (
          <div className="flex items-center justify-center h-full py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ledger-gray-400" />
          </div>
        ) : viewerMode === 'text-edit' ? (
          isMarkdownOrText ? (
            <textarea
              className="w-full h-full p-6 font-mono text-sm text-kx-text-primary bg-nb-input resize-none focus:outline-none"
              value={rawTextEdit}
              onChange={e => { setRawTextEdit(e.target.value); setIsDirty(true) }}
            />
          ) : (
            <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => setIsDirty(true)}
                className="legal-document bg-white mx-auto my-4 shadow-sm focus:outline-none ring-2 ring-kx-primary-300"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: '1.6', color: '#000', width: '794px', maxWidth: 'calc(100% - 48px)', minHeight: '900px', padding: '72px 96px' }}
              />
            </div>
          )
        ) : isMarkdownOrText && textContent !== null ? (
          <pre className="w-full h-full overflow-auto p-6 text-sm text-kx-text-primary font-mono whitespace-pre-wrap break-words leading-relaxed">
            {textContent}
          </pre>
        ) : isTextual && textContent !== null ? (
          <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800">
            <div
              className="legal-document bg-white mx-auto my-4 shadow-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: '1.6', color: '#000', width: '794px', maxWidth: 'calc(100% - 48px)', minHeight: '900px', padding: '72px 96px' }}
              dangerouslySetInnerHTML={{ __html: renderDraftToHtml(textContent) }}
            />
          </div>
        ) : blobUrl && (isPdf || doc.type === DocumentType.JUDGMENT) ? (
          <iframe src={blobUrl} className="w-full h-full border-0" title={displayName} />
        ) : blobUrl && isImage ? (
          <div className="flex items-center justify-center p-6 h-full">
            <img src={blobUrl} alt={displayName} className="max-w-full max-h-full object-contain rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <Icon className="h-10 w-10 text-ledger-gray-300" />
            <p className="text-sm font-medium text-kx-text-primary">Preview not available</p>
            {canDownload && (
              <Button size="sm" variant="ghost" className="border border-kx-card-border gap-1.5" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" /> Download file
              </Button>
            )}
          </div>
        )}
      </div>

      {onlyOfficeOpen && (
        <OnlyOfficeEditor
          documentId={doc.id}
          caseId={doc.caseId ?? null}
          onClose={() => setOnlyOfficeOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Upload dialog ────────────────────────────────────────────────────────────

function UploadDialog({ open, onOpenChange, onUploaded }: { open: boolean; onOpenChange: (v: boolean) => void; onUploaded: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [docType, setDocType] = useState<DocumentRecordType>(DocumentType.USER_UPLOADED)
  const [caseId, setCaseId] = useState('')
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    caseApi.getAll({ size: 50 }).then(res => {
      const content = res.data?.content ?? []
      setCases(content.map(c => ({ id: c.id, label: c.title || c.caseNumber || c.id })))
    }).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open) { setFiles([]); setCaseId(''); setDocType(DocumentType.USER_UPLOADED); setIsDragging(false) }
  }, [open])

  const addFiles = (incoming: FileList | null) => { if (!incoming) return; setFiles(prev => [...prev, ...Array.from(incoming)]) }
  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)
    try {
      await Promise.all(files.map(f => uploadToolboxFile(f, { type: docType, caseId: caseId || undefined })))
      toast({ title: `${files.length} file${files.length > 1 ? 's' : ''} uploaded` })
      onOpenChange(false)
      onUploaded()
    } catch (e) {
      toast({ title: 'Upload failed', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' })
    } finally { setIsUploading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>Add files to your document library</DialogDescription>
        </DialogHeader>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragging ? 'border-kx-primary-400 bg-kx-primary-50 dark:bg-kx-primary-950/20' : 'border-kx-card-border hover:border-kx-primary-300 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/40'
          )}
        >
          <Upload className="h-7 w-7 mx-auto mb-2 text-ledger-gray-400" />
          <p className="text-sm font-medium text-kx-text-primary">Drop files here or click to browse</p>
          <p className="text-xs text-ledger-gray-400 mt-1">PDF, DOCX, PNG, JPG supported</p>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" className="hidden" onChange={e => addFiles(e.target.files)} />
        </div>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-800 text-xs max-w-full">
                <span className="truncate max-w-[160px] text-kx-text-primary">{f.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-full text-ledger-gray-400 hover:text-red-500 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Document Type</label>
            <Select value={docType} onChange={e => setDocType(e.target.value as DocumentRecordType)}>
              <option value="USER_UPLOADED">Uploaded</option>
              <option value="DRAFT">Draft</option>
              <option value="SUMMARY">Summary</option>
              <option value="JUDGMENT">Judgment</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Assign to Case</label>
            <Select value={caseId} onChange={e => setCaseId(e.target.value)} searchable searchPlaceholder="Search cases...">
              <option value="">Standalone</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || isUploading} className="gap-1.5">
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload{files.length > 0 ? ` (${files.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Documents Page ───────────────────────────────────────────────────────────

export function DocumentsPage() {
  const [allDocs, setAllDocs] = useState<DocumentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toolCtx, setToolCtx] = useState<ToolContext>({ id: null })
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Filters / sort / pagination — all server-side
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilters, setTypeFilters] = useState<Set<DocumentRecordType>>(new Set())
  const [typeFilterOpen, setTypeFilterOpen] = useState(false)
  const typeFilterRef = useRef<HTMLDivElement>(null)
  const [caseFilter, setCaseFilter] = useState('') // '' = all, 'standalone' = unlinked, uuid = specific case
  const [sort, setSort] = useState('createdAt,desc')
  const [page, setPage] = useState(0) // 0-based

  // Cases for dropdown
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; doc: DocumentRecord | null }>({ open: false, doc: null })

  const { setSidebarCollapsed } = useUIState()
  const prevSidebarCollapsedRef = useRef<boolean | null>(null)
  const [searchParams] = useSearchParams()
  const openDocId = searchParams.get('open')

  const selectedDoc = allDocs.find(d => d.id === selectedDocId) ?? null
  const viewerOpen = selectedDocId !== null && toolCtx.id === null

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0) }, 400)
    return () => clearTimeout(t)
  }, [search])

  // Load cases for dropdown
  useEffect(() => {
    caseApi.getAll({ size: 100 }).then(res => {
      const content = res.data?.content ?? []
      setCases(content.map(c => ({ id: c.id, label: c.title || c.caseNumber || c.id })))
    }).catch(() => {})
  }, [])

  // Auto-collapse sidebar when viewer opens
  useEffect(() => {
    if (viewerOpen) {
      if (prevSidebarCollapsedRef.current === null) prevSidebarCollapsedRef.current = false
      setSidebarCollapsed(true)
    } else if (prevSidebarCollapsedRef.current !== null) {
      setSidebarCollapsed(prevSidebarCollapsedRef.current)
      prevSidebarCollapsedRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen])

  const fetchDocs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const linked = caseFilter === 'standalone' ? false : undefined
      const caseId = caseFilter && caseFilter !== 'standalone' ? caseFilter : undefined
      const { documents, total: t, totalPages: tp } = await listAllDocuments({
        page,
        size: PAGE_SIZE,
        type: typeFilters.size === 1 ? Array.from(typeFilters)[0] : undefined,
        caseId,
        linked,
        search: debouncedSearch || undefined,
        sort,
      })
      setAllDocs(documents)
      setTotal(t)
      setTotalPages(tp)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [page, typeFilters, caseFilter, debouncedSearch, sort])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // Auto-open doc from ?open= param once docs are loaded
  useEffect(() => {
    if (openDocId && allDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(openDocId)
    }
  }, [openDocId, allDocs, selectedDocId])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [typeFilters, caseFilter, sort])

  // Close type filter dropdown on outside click
  useEffect(() => {
    if (!typeFilterOpen) return
    const handler = (e: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(e.target as Node)) setTypeFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [typeFilterOpen])

  const toggleTypeFilter = (type: DocumentRecordType) => {
    setTypeFilters(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
    setPage(0)
  }

  const handleSort = (field: string) => {
    const [currentField, currentDir] = sort.split(',')
    if (currentField === field) {
      setSort(`${field},${currentDir === 'asc' ? 'desc' : 'asc'}`)
    } else {
      setSort(`${field},asc`)
    }
    setPage(0)
  }

  const sortField = sort.split(',')[0]
  const sortDir = sort.split(',')[1] as 'asc' | 'desc'

  const toggleDocCheck = (docId: string, checked: boolean) => {
    setSelectedIds(prev => { const next = new Set(prev); checked ? next.add(docId) : next.delete(docId); return next })
  }
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === allDocs.length && allDocs.length > 0 ? new Set() : new Set(allDocs.map(d => d.id)))
  }
  const clearSelection = () => setSelectedIds(new Set())
  const selectedPdfs = allDocs.filter(d => selectedIds.has(d.id) && d.fileType === 'PDF')

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    try {
      await workspaceApi.batchDeleteDocuments(ids)
      toast({ title: `${ids.length} document${ids.length > 1 ? 's' : ''} deleted` })
      clearSelection()
      fetchDocs()
    } catch { toast({ title: 'Delete failed', variant: 'destructive' }) }
  }

  const openTool = (id: ActiveToolId, ctx?: Omit<ToolContext, 'id'>) => { setSelectedDocId(null); setToolCtx({ id, ...ctx }) }
  const closeTool = () => { setToolCtx({ id: null }); fetchDocs() }
  const closeViewer = () => setSelectedDocId(null)

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      if (doc.downloadUrl) await downloadDocument(doc.downloadUrl, doc.name)
      else if (doc.storageUrl) triggerDirectDownload(doc.storageUrl, doc.originalFilename || doc.name)
      else toast({ title: 'Download not available' })
    } catch { toast({ title: 'Download failed', variant: 'destructive' }) }
  }

  const handleDelete = async (doc: DocumentRecord) => {
    try {
      await apiClient.delete(`/api/v1/documents/${doc.id}`)
      toast({ title: 'Document deleted' })
      fetchDocs()
    } catch { toast({ title: 'Delete failed', variant: 'destructive' }) }
  }

  const handleRowAction = (doc: DocumentRecord, action: DocRowAction) => {
    if (action === 'download')  { handleDownload(doc); return }
    if (action === 'delete')    { handleDelete(doc); return }
    if (action === 'assign')    { setAssignDialog({ open: true, doc }); return }
    if (action === 'split')     { openTool('split',       { initialDoc: toProcessedDoc(doc) }); return }
    if (action === 'convert')   { openTool('convert',     { initialDoc: toProcessedDoc(doc) }); return }
    if (action === 'compress')  { openTool('compress',    { initialDoc: toProcessedDoc(doc) }); return }
    if (action === 'translate') { openTool('translation', { initialDoc: toProcessedDoc(doc) }); return }
  }

  const from = page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  const SortBtn = ({ field, label }: { field: string; label: string }) => (
    <button type="button" onClick={() => handleSort(field)}
      className={cn('flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors select-none',
        sortField === field ? 'text-kx-primary-600 dark:text-kx-primary-400' : 'text-ledger-gray-400 hover:text-kx-text-primary')}>
      {label}
      <span className="ml-0.5 text-[9px]">
        {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-kx-primary-900 dark:text-kx-primary-100">Documents</h1>
          <p className="text-sm text-ledger-gray-400 mt-0.5">Manage, analyze, and process your legal files.</p>
        </div>
        <Button size="sm" className="gap-2 h-9 px-4" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
      </div>

      {/* ── Tools tab bar — hidden when viewer open ── */}
      {!viewerOpen && (
        <div className="px-6 mb-4 flex-shrink-0">
          <div className="flex items-center gap-1 border border-kx-card-border rounded-xl px-2 py-1.5 bg-kx-card w-fit">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-ledger-gray-100 dark:bg-ledger-gray-800 mr-1">
              <Settings2 className="h-3.5 w-3.5 text-ledger-gray-500" />
              <span className="text-xs font-semibold text-ledger-gray-600 dark:text-ledger-gray-300">Tools</span>
            </div>
            {TOOLS.map(tool => {
              const ToolIcon = tool.icon
              const isActive = toolCtx.id === tool.id
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => isActive ? closeTool() : openTool(tool.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isActive
                      ? 'bg-kx-primary-600 text-white shadow-sm'
                      : 'text-ledger-gray-500 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 hover:text-kx-primary-700'
                  )}
                >
                  <ToolIcon className="h-3.5 w-3.5" />
                  {tool.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Search + filter row — hidden when viewer open ── */}
      {!viewerOpen && (
        <div className="px-6 mb-3 flex items-center gap-3 flex-shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm border border-kx-card-border rounded-lg bg-kx-card text-kx-text-primary placeholder-ledger-gray-400 focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
            />
          </div>

          {/* Case filter */}
          <div className="w-52">
            <Select value={caseFilter} onChange={e => setCaseFilter(e.target.value)} searchable searchPlaceholder="Search cases...">
              <option value="">All Cases</option>
              <option value="standalone">Standalone only</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </div>

          {/* Type multi-select dropdown */}
          <div ref={typeFilterRef} className="relative">
            <button
              type="button"
              onClick={() => setTypeFilterOpen(v => !v)}
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap',
                typeFilters.size > 0 || typeFilterOpen
                  ? 'border-kx-primary-400 bg-kx-primary-50 text-kx-primary-700 dark:bg-kx-primary-950/30'
                  : 'border-kx-card-border text-ledger-gray-500 hover:border-kx-primary-300 hover:text-kx-primary-700'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="max-w-[140px] truncate">
                {typeFilters.size === 0
                  ? 'All Types'
                  : Array.from(typeFilters).map(t => TYPE_META[t].label).join(', ')}
              </span>
              {typeFilters.size > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-kx-primary-600 text-white text-[9px] font-bold flex-shrink-0">
                  {typeFilters.size}
                </span>
              )}
            </button>
            {typeFilterOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-700 bg-kx-card shadow-lg py-1">
                {([DocumentType.USER_UPLOADED, DocumentType.DRAFT, DocumentType.SUMMARY, DocumentType.JUDGMENT] as const).map(t => {
                  const isChecked = typeFilters.has(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTypeFilter(t)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-kx-text-primary hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800 transition-colors"
                    >
                      <div className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                        isChecked ? 'bg-kx-primary-600 border-kx-primary-600 text-white' : 'border-ledger-gray-300 dark:border-ledger-gray-600'
                      )}>
                        {isChecked && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {TYPE_META[t].label}
                    </button>
                  )
                })}
                {typeFilters.size > 0 && (
                  <div className="border-t border-ledger-gray-100 dark:border-ledger-gray-800 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => { setTypeFilters(new Set()); setPage(0) }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800 transition-colors"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 min-h-0 border-t border-kx-card-border">

        {/* List — LEFT always, narrows to 380px when viewer open */}
        <div className={cn(
          'flex flex-col overflow-hidden',
          viewerOpen ? 'w-[380px] flex-shrink-0 border-r border-kx-card-border' : 'flex-1'
        )}>

          {/* Selection action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-kx-primary-50 dark:bg-kx-primary-950/30 border-b border-kx-primary-200 dark:border-kx-primary-800 flex-shrink-0">
              <span className="text-sm font-medium text-kx-primary-700 dark:text-kx-primary-300">{selectedIds.size} selected</span>
              {selectedPdfs.length >= 2 && (
                <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs border border-kx-card-border"
                  onClick={() => { const docs = selectedPdfs.map(toProcessedDoc); clearSelection(); openTool('merge', { initialDocs: docs }) }}>
                  <Layers className="h-3.5 w-3.5" /> Merge
                </Button>
              )}
              <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs border border-kx-card-border"
                onClick={() => { const doc = allDocs.find(d => selectedIds.has(d.id)); if (doc) setAssignDialog({ open: true, doc }) }}>
                <FolderInput className="h-3.5 w-3.5" /> Assign
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <button type="button" onClick={clearSelection} className="ml-auto h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Column headers */}
          {!isLoading && !error && allDocs.length > 0 && selectedIds.size === 0 && (
            <div className={cn(
              'grid items-center gap-4 px-4 py-2.5 border-b border-kx-card-border bg-ledger-gray-50 dark:bg-ledger-gray-900/20 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ledger-gray-400',
              viewerOpen
                ? 'grid-cols-[20px_36px_1fr_28px]'
                : 'grid-cols-[28px_40px_1fr_180px_130px]'
            )}>
              <button type="button" onClick={toggleSelectAll}
                className={cn('h-4 w-4 rounded border flex items-center justify-center transition-colors',
                  selectedIds.size === allDocs.length && allDocs.length > 0
                    ? 'bg-kx-primary-600 border-kx-primary-600 text-white'
                    : 'border-ledger-gray-300 dark:border-ledger-gray-600 hover:border-kx-primary-400')}>
                {selectedIds.size === allDocs.length && allDocs.length > 0 && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div />
              <SortBtn field="fileName" label="Name" />
              {!viewerOpen && (
                <>
                  <SortBtn field="caseTitle" label="Case" />
                  <SortBtn field="createdAt" label="Date Added" />
                </>
              )}
            </div>
          )}

          {/* Table body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-ledger-gray-400" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
                <p className="text-sm text-ledger-gray-500">{error}</p>
                <Button variant="ghost" size="sm" onClick={fetchDocs}>Try again</Button>
              </div>
            ) : allDocs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
                <BookOpen className="h-8 w-8 text-ledger-gray-300" />
                <p className="font-medium text-kx-primary-900 dark:text-kx-primary-100">No documents found</p>
                <p className="text-sm text-ledger-gray-400">
                  {search || typeFilters.size > 0 || caseFilter ? 'Try adjusting your filters.' : 'Upload a document to get started.'}
                </p>
                {!search && typeFilters.size === 0 && !caseFilter && (
                  <Button size="sm" variant="ghost" className="mt-1 border border-kx-card-border gap-1.5" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-3.5 w-3.5" /> Upload a file
                  </Button>
                )}
              </div>
            ) : (
              <div>
                {allDocs.map(doc => (
                  <DocTableRow
                    key={doc.id}
                    doc={doc}
                    selected={selectedDocId === doc.id}
                    onSelect={() => setSelectedDocId(prev => prev === doc.id ? null : doc.id)}
                    onAction={action => handleRowAction(doc, action)}
                    checked={selectedIds.has(doc.id)}
                    onCheck={checked => toggleDocCheck(doc.id, checked)}
                    compact={viewerOpen}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Pagination footer ── */}
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-kx-card-border flex-shrink-0 bg-kx-card">
              <p className="text-sm text-ledger-gray-400">
                Showing <span className="font-medium text-kx-text-primary">{from}</span> to{' '}
                <span className="font-medium text-kx-text-primary">{to}</span> of{' '}
                <span className="font-medium text-kx-text-primary">{total}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 border border-kx-card-border gap-1"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 border border-kx-card-border gap-1"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Viewer — RIGHT side when open */}
        {viewerOpen && selectedDoc && (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <DocumentViewer doc={selectedDoc} onClose={closeViewer} onOpenTool={openTool} />
          </div>
        )}
      </div>

      {/* Tool dialogs */}
      {TOOLS.map(tool => (
        <Dialog key={tool.id} open={toolCtx.id === tool.id} onOpenChange={open => { if (!open) closeTool() }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            {toolCtx.id === tool.id && (() => {
              switch (tool.id) {
                case 'split':       return <SplitterDialog   onBack={closeTool} initialDoc={toolCtx.initialDoc} />
                case 'merge':       return <MergerDialog     onBack={closeTool} initialDocs={toolCtx.initialDocs} />
                case 'convert':     return <ConverterDialog  onBack={closeTool} initialDoc={toolCtx.initialDoc} />
                case 'compress':    return <CompressorDialog  onBack={closeTool} initialDoc={toolCtx.initialDoc} />
                case 'translation': return <TranslationDialog onBack={closeTool} />
                default:            return null
              }
            })()}
          </DialogContent>
        </Dialog>
      ))}

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUploaded={fetchDocs} />

      <AssignCaseDialog
        open={assignDialog.open}
        onOpenChange={v => { if (!v) setAssignDialog({ open: false, doc: null }) }}
        document={assignDialog.doc ? toProcessedDoc(assignDialog.doc) : null}
        onAssigned={() => { fetchDocs(); setAssignDialog({ open: false, doc: null }) }}
      />
    </div>
  )
}

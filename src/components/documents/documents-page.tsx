import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Upload, Scissors, Minimize2, Layers,
  FileText, File, Download,
  Loader2, PenLine, Languages, Scale,
  BookOpen, X, Search, PanelRight, MoreVertical, Trash2, ArrowLeft, Link2,
  AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUp, ArrowDown, ArrowUpDown,
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
  linkDocumentToCase,
  type DocumentRecordType,
} from '@/services/api/doc-processing-api'
import { workspaceApi } from '@/services/api/workspace-api'
import { config } from '@/config/env'
import { caseApi } from '@/services/api/case-api'
import { ApiError } from '@/services/api/api-client'
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
import { useSearchParams } from 'react-router-dom'
import type {
  DocumentRecord,
  ProcessedDocumentInfo,
} from '@/services/api/doc-processing-api'
import { DocumentType, JobStatus, GENERATED_DOC_TYPES } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveToolId = null | 'split' | 'merge' | 'convert' | 'compress' | 'translation'
interface ToolContext {
  id: ActiveToolId
  initialDoc?: ProcessedDocumentInfo
  initialDocs?: ProcessedDocumentInfo[]
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
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

const TOOLS: {
  id: Exclude<ActiveToolId, null>
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
}[] = [
  { id: 'merge',       label: 'Merge',     description: 'Combine multiple PDFs',    icon: Layers,    iconColor: 'text-blue-600',    iconBg: 'bg-blue-50 dark:bg-blue-950/40' },
  { id: 'split',       label: 'Split',     description: 'Split a PDF into parts',   icon: Scissors,  iconColor: 'text-violet-600',  iconBg: 'bg-violet-50 dark:bg-violet-950/40' },
  { id: 'translation', label: 'Translate', description: 'Translate document text',  icon: Languages, iconColor: 'text-teal-600',    iconBg: 'bg-teal-50 dark:bg-teal-950/40' },
  { id: 'compress',    label: 'Compress',  description: 'Reduce file size',         icon: Minimize2, iconColor: 'text-orange-600',  iconBg: 'bg-orange-50 dark:bg-orange-950/40' },
  { id: 'convert',     label: 'Convert',   description: 'Convert to another format',icon: BookOpen,  iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40' },
]

// ─── DocTableRow ──────────────────────────────────────────────────────────────

function DocTableRow({
  doc, selected, checked, onSelect, onCheck, onDelete, onAssignToCase,
}: {
  doc: DocumentRecord
  selected: boolean
  checked: boolean
  onSelect: () => void
  onCheck: (e: React.MouseEvent) => void
  onDelete: () => void
  onAssignToCase: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const displayName = doc.originalFilename || doc.name
  const meta = TYPE_META[doc.type]
  const isGenerating = GENERATED_DOC_TYPES.has(doc.type) && doc.jobStatus === JobStatus.PROCESSING
  const isGenFailed   = GENERATED_DOC_TYPES.has(doc.type) && doc.jobStatus === JobStatus.FAILED
  const isUnassigned  = !doc.caseId

  useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  return (
    <tr
      onClick={onSelect}
      className={cn(
        'cursor-pointer transition-all duration-150 group bg-kx-card',
        'hover:bg-kx-primary-50 dark:hover:bg-kx-primary-50',
        selected || checked
          ? 'bg-kx-primary-50 dark:bg-kx-primary-950/20 border-l-2 border-l-kx-primary-500'
          : 'border-l-2 border-l-transparent hover:border-l-kx-primary-500'
      )}
    >
      {/* Checkbox */}
      <td className="pl-4 pr-2 py-3 w-10 align-middle" onClick={onCheck}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          className="h-4 w-4 rounded border-ledger-gray-300 text-kx-primary-600 focus:ring-kx-primary-400 cursor-pointer"
        />
      </td>
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileIcon fileType={doc.fileType} className="flex-shrink-0" />
          <div className="min-w-0">
            <p className={cn(
              'text-sm font-medium truncate max-w-xs',
              selected || checked ? 'text-kx-primary-900 dark:text-kx-primary-100' : 'text-kx-text-primary'
            )}>
              {displayName}
            </p>
            {isGenerating && (
              <span className="flex items-center gap-1 text-[10px] text-kx-primary-600 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-kx-primary-500 animate-pulse" />
                Generating
              </span>
            )}
            {isGenFailed && <span className="text-[10px] text-red-500 mt-0.5 block">Failed</span>}
          </div>
        </div>
      </td>
      {/* Type */}
      <td className="px-4 py-3">
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', meta.className)}>
          {meta.label}
        </span>
      </td>
      {/* Case */}
      <td className="px-4 py-3 text-sm text-kx-text-secondary max-w-[160px] truncate">
        {doc.caseTitle ?? <span className="text-ledger-gray-300">—</span>}
      </td>
      {/* Date */}
      <td className="px-4 py-3 text-xs text-ledger-gray-400 whitespace-nowrap tabular-nums">
        {formatDate(doc.createdAt)}
      </td>
      {/* Three-dot actions */}
      <td className="pr-3 py-3 w-10 align-middle" onClick={e => e.stopPropagation()}>
        <div className="relative flex justify-center" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="h-7 w-7 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 min-w-[160px] rounded-lg border border-kx-card-border bg-kx-card shadow-lg py-1">
              {isUnassigned && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onAssignToCase() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kx-text-primary hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5 text-ledger-gray-400" />
                  Assign to case
                </button>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── DocumentViewer ───────────────────────────────────────────────────────────

function DocumentViewer({
  doc, onClose, onOpenTool: _onOpenTool, autoEdit = false,
}: {
  doc: DocumentRecord
  onClose: () => void
  onOpenTool: (id: ActiveToolId, ctx?: Omit<ToolContext, 'id'>) => void
  autoEdit?: boolean
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
  const isSummary = doc.type === DocumentType.SUMMARY
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

  // Populate contentEditable after it mounts (viewerMode === 'text-edit' renders the div)
  useEffect(() => {
    if (viewerMode === 'text-edit' && (isDraft || isSummary) && editorRef.current && textContent) {
      editorRef.current.innerHTML = renderDraftToHtml(textContent)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerMode])

  const handleEdit = () => {
    if (isMarkdownOrText && textContent !== null) {
      setRawTextEdit(textContent)
      setViewerMode('text-edit')
    } else if ((isDraft || isSummary) && textContent !== null) {
      setViewerMode('text-edit')
    } else {
      setOnlyOfficeOpen(true)
    }
  }

  // Auto-enter edit mode when navigated here with ?edit=true
  useEffect(() => {
    if (autoEdit && !isLoadingContent && (isDraft || isSummary) && textContent !== null) {
      setViewerMode('text-edit')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEdit, isLoadingContent, textContent])

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
        const html = editorRef.current.innerHTML
        const token = localStorage.getItem('auth_token')
        const userId = localStorage.getItem('auth_user_id')
        const headers: Record<string, string> = { 'Content-Type': 'text/plain' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (userId) headers['x-user-id'] = userId
        const res = await fetch(`${config.apiBaseUrl}/api/v1/documents/${doc.id}/content`, {
          method: 'PUT', headers, body: html,
        })
        if (!res.ok) throw new Error()
        setTextContent(html)
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-kx-card-border flex-shrink-0 bg-kx-card">
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm text-ledger-gray-500 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Documents
        </button>
        <span className="text-ledger-gray-300 text-sm flex-shrink-0">/</span>
        <FileIcon fileType={doc.fileType} className="h-6 w-6 text-xs flex-shrink-0" />
        <span className="flex-1 min-w-0 text-sm font-medium text-kx-text-primary truncate">{displayName}</span>
        <span className={cn('flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide', meta.className)}>
          {meta.label}
        </span>
        {doc.type === DocumentType.USER_UPLOADED && isMarkdownOrText && viewerMode === 'view' && (
          <Button size="sm" onClick={handleEdit} className="gap-1.5 h-7 text-xs flex-shrink-0">
            <PenLine className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        {canDownload && viewerMode === 'view' && (
          <button type="button" onClick={handleDownload} title="Download" className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      {(isDraft || isSummary) && (
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
          <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800">
            <div
              className="legal-document bg-white mx-auto my-4 shadow-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: '1.6', color: '#000', width: '794px', maxWidth: 'calc(100% - 48px)', minHeight: '900px', padding: '72px 96px' }}
              dangerouslySetInnerHTML={{ __html: renderDraftToHtml(textContent) }}
            />
          </div>
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
      setCases(content.map(c => ({ id: c.id, label: c.caseTitle || c.caseNumber || c.id })))
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
  const [caseFilter, setCaseFilter] = useState('') // '' = all, 'standalone' = unlinked, uuid = specific case
  const [sort, setSort] = useState('createdAt,desc')
  const [page, setPage] = useState(0) // 0-based
  const [pageSize, setPageSize] = useState(20)

  // Cases for dropdown
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [assignDocId, setAssignDocId] = useState<string | null>(null)
  const [assignCaseId, setAssignCaseId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const [toolsPanelOpen, setToolsPanelOpen] = useState(true)
  const prevToolsPanelOpenRef = useRef<boolean>(true)

  const [searchParams] = useSearchParams()
  const openDocId = searchParams.get('open')
  const autoEditParam = searchParams.get('edit') === 'true'

  const selectedDoc = allDocs.find(d => d.id === selectedDocId) ?? null
  const viewerOpen = selectedDocId !== null

  // Auto-collapse tools panel when a doc is selected, restore when deselected
  useEffect(() => {
    if (selectedDocId !== null) {
      prevToolsPanelOpenRef.current = toolsPanelOpen
      setToolsPanelOpen(false)
    } else {
      setToolsPanelOpen(prevToolsPanelOpenRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocId])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0) }, 400)
    return () => clearTimeout(t)
  }, [search])

  // Load cases for dropdown
  useEffect(() => {
    caseApi.getAll({ size: 100 }).then(res => {
      const content = res.data?.content ?? []
      setCases(content.map(c => ({ id: c.id, label: c.caseTitle || c.caseNumber || c.id })))
    }).catch(() => {})
  }, [])

  const fetchDocs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const linked = caseFilter === 'standalone' ? false : undefined
      const caseId = caseFilter && caseFilter !== 'standalone' ? caseFilter : undefined
      const { documents, total: t, totalPages: tp } = await listAllDocuments({
        page,
        size: pageSize,
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
  }, [page, pageSize, typeFilters, caseFilter, debouncedSearch, sort])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // Auto-open doc from ?open= param once docs are loaded
  useEffect(() => {
    if (openDocId && allDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(openDocId)
    }
  }, [openDocId, allDocs, selectedDocId])

  // Reset page when filters or page size change
  useEffect(() => { setPage(0) }, [typeFilters, caseFilter, sort, pageSize])

  const handleSort = (field: string) => {
    setSort(prev => {
      const [prevField, prevDir] = prev.split(',')
      if (prevField === field) return `${field},${prevDir === 'desc' ? 'asc' : 'desc'}`
      return `${field},desc`
    })
    setPage(0)
  }

  const handleDeleteDocs = async (ids: string[]) => {
    setIsDeleting(true)
    try {
      await workspaceApi.batchDeleteDocuments(ids)
      toast({ title: `${ids.length} document${ids.length !== 1 ? 's' : ''} deleted` })
      setCheckedIds(new Set())
      if (ids.includes(selectedDocId ?? '')) setSelectedDocId(null)
      fetchDocs()
    } catch (e) {
      toast({ title: 'Delete failed', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allChecked = allDocs.length > 0 && allDocs.every(d => checkedIds.has(d.id))
  const someChecked = allDocs.some(d => checkedIds.has(d.id))

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(allDocs.map(d => d.id)))
    }
  }

  const handleAssignToCase = async () => {
    if (!assignDocId || !assignCaseId) return
    setIsAssigning(true)
    try {
      await linkDocumentToCase(assignDocId, assignCaseId)
      toast({ title: 'Document assigned to case' })
      setAssignDocId(null)
      setAssignCaseId('')
      fetchDocs()
    } catch (e) {
      toast({ title: 'Failed to assign', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' })
    } finally { setIsAssigning(false) }
  }

  const openTool = (id: ActiveToolId, ctx?: Omit<ToolContext, 'id'>) => { setToolCtx({ id, ...ctx }) }
  const closeTool = () => { setToolCtx({ id: null }); fetchDocs() }
  const closeViewer = () => setSelectedDocId(null)

  const handleToolClick = (id: Exclude<ActiveToolId, null>) => {
    if (!selectedDoc) {
      toast({ title: id === 'merge' ? 'Select two or more documents to merge' : 'Please select a document first' })
      return
    }
    const asProcessed: import('@/services/api/doc-processing-api').ProcessedDocumentInfo = {
      id: selectedDoc.id,
      fileName: selectedDoc.originalFilename || selectedDoc.name,
      fileSize: selectedDoc.fileSize ?? 0,
      pageCount: 0,
      createdAt: selectedDoc.createdAt ?? undefined,
      downloadUrl: selectedDoc.downloadUrl ?? undefined,
    }
    if (id === 'merge') {
      openTool('merge', { initialDocs: [asProcessed] })
    } else {
      openTool(id, { initialDoc: asProcessed })
    }
  }



  const [sortField] = sort.split(',')

  const [, sortDir] = sort.split(',')

  const SortableHeader = ({ field, label, className, withIconSpacer }: { field: string; label: string; className?: string; withIconSpacer?: boolean }) => {
    const isActive = sortField === field
    const SortIcon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
    return (
      <th
        className={cn('px-4 py-3 text-left font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-kx-primary-600 transition-colors', className)}
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-3">
          {withIconSpacer && <span className="h-8 w-8 flex-shrink-0 inline-block" />}
          <span className="inline-flex items-center gap-1">
            {label}
            <SortIcon className={cn('h-3 w-3', isActive ? 'text-kx-primary-600' : 'text-ledger-gray-400')} />
          </span>
        </span>
      </th>
    )
  }

  return (
    <div className="h-full overflow-hidden bg-kx-surface flex">

      {/* ── MAIN PANEL ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {viewerOpen ? (
          /* Full-screen document viewer */
          <DocumentViewer doc={selectedDoc!} onClose={closeViewer} onOpenTool={openTool} autoEdit={autoEditParam} />
        ) : (
          /* Full-screen document listing */
          <>
            {/* Sticky header + filters */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 space-y-4 border-b border-kx-card-border bg-kx-surface">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900 dark:text-kx-primary-100">
                    Documents
                  </h2>
                  <p className="text-sm text-ledger-gray-500 mt-1">
                    {total > 0
                      ? `${total.toLocaleString()} document${total !== 1 ? 's' : ''} across your workspace`
                      : 'Manage, preview, and process your case documents'}
                  </p>
                </div>
                <Button size="sm" className="gap-1.5 h-9 px-3 text-xs w-full sm:w-auto" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Filters pill */}
              <div className="flex items-center gap-2 p-3 bg-ledger-gray-50 dark:bg-ledger-gray-900 rounded-lg border border-ledger-gray-200 min-w-0">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-8 text-sm border border-kx-card-border rounded-lg bg-nb-input text-kx-text-primary placeholder-ledger-gray-400 focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ledger-gray-400 hover:text-ledger-gray-600 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Select value={caseFilter} onChange={e => setCaseFilter(e.target.value)}
                  searchable searchPlaceholder="Search cases..." className="w-[160px] h-9 text-sm">
                  <option value="">All Cases</option>
                  <option value="standalone">Standalone only</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
                <Select
                  value={typeFilters.size === 1 ? Array.from(typeFilters)[0] : ''}
                  onChange={e => { const v = e.target.value as DocumentRecordType; setTypeFilters(v ? new Set([v]) : new Set()); setPage(0) }}
                  className="w-[130px] h-9 text-sm">
                  <option value="">All Types</option>
                  {(Object.keys(TYPE_META) as DocumentType[]).map(t => (
                    <option key={t} value={t}>{TYPE_META[t].label}</option>
                  ))}
                </Select>
              </div>

            </div>

            {/* Scrollable table area */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              <div className="px-6 py-4">
                <div className="rounded-lg border border-kx-card-border">
                  {isLoading ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-ledger-gray-50 dark:bg-ledger-gray-100 border-b border-kx-card-border">
                          {['', 'Name', 'Type', 'Case', 'Date Added', ''].map((_h, i) => (
                            <th key={i} className="px-4 py-3"><div className="h-3 w-16 bg-ledger-gray-200 rounded animate-pulse" /></th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-kx-card-border">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} className="bg-kx-card">
                            <td className="pl-4 pr-2 py-3 w-8"><div className="h-4 w-4 rounded bg-ledger-gray-100 animate-pulse" /></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-ledger-gray-100 animate-pulse flex-shrink-0" />
                                <div className="h-4 w-48 bg-ledger-gray-100 rounded animate-pulse" />
                              </div>
                            </td>
                            <td className="px-4 py-3"><div className="h-5 w-16 bg-ledger-gray-100 rounded-full animate-pulse" /></td>
                            <td className="px-4 py-3"><div className="h-4 w-28 bg-ledger-gray-100 rounded animate-pulse" /></td>
                            <td className="px-4 py-3"><div className="h-4 w-20 bg-ledger-gray-100 rounded animate-pulse" /></td>
                            <td className="pr-3 py-3 w-8" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : allDocs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-center">
                      <div className="h-16 w-16 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-200 flex items-center justify-center">
                        <BookOpen className="h-7 w-7 text-ledger-gray-400" />
                      </div>
                      <h3 className="text-lg font-serif font-semibold text-kx-text-primary">No documents found</h3>
                      <p className="text-sm text-ledger-gray-500 max-w-sm">
                        {search || typeFilters.size > 0 || caseFilter ? 'Try adjusting your filters.' : 'Upload a document to get started.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-ledger-gray-50 dark:bg-ledger-gray-100 border-b border-kx-card-border">
                            <th className="pl-4 pr-2 py-3 w-10 align-middle" onClick={toggleAll}>
                              <input
                                type="checkbox"
                                checked={allChecked}
                                ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                                onChange={toggleAll}
                                className="h-4 w-4 rounded border-ledger-gray-300 text-kx-primary-600 focus:ring-kx-primary-400 cursor-pointer"
                              />
                            </th>
                            {someChecked ? (
                              <th colSpan={4} className="px-4 py-3 text-left">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-semibold text-kx-primary-700 dark:text-kx-primary-300">
                                    {checkedIds.size} selected
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => handleDeleteDocs(Array.from(checkedIds))}
                                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                                  >
                                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    Delete
                                  </button>
                                  <button type="button" onClick={() => setCheckedIds(new Set())}
                                    className="text-xs text-ledger-gray-400 hover:text-kx-text-primary transition-colors ml-2">
                                    Clear
                                  </button>
                                </div>
                              </th>
                            ) : (
                              <>
                                <SortableHeader field="name" label="Name" className="w-[38%]" withIconSpacer />
                                <th className="px-4 py-3 text-left font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
                                <SortableHeader field="caseTitle" label="Case" />
                                <SortableHeader field="createdAt" label="Date Added" />
                              </>
                            )}
                            <th className="pr-3 py-3 w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-kx-card-border">
                          {allDocs.map(doc => (
                            <DocTableRow
                              key={doc.id}
                              doc={doc}
                              selected={selectedDocId === doc.id}
                              checked={checkedIds.has(doc.id)}
                              onSelect={() => setSelectedDocId(prev => prev === doc.id ? null : doc.id)}
                              onCheck={e => toggleCheck(doc.id, e)}
                              onDelete={() => handleDeleteDocs([doc.id])}
                              onAssignToCase={() => { setAssignDocId(doc.id); setAssignCaseId('') }}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!isLoading && total > 0 && (
                    <div className="px-4 py-3 border-t border-ledger-gray-200 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-ledger-gray-500 whitespace-nowrap">Rows per page</label>
                          <div className="w-20">
                            <Select value={String(pageSize)} onChange={e => setPageSize(Number(e.target.value))} className="h-8 text-xs">
                              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={String(n)}>{n}</option>)}
                            </Select>
                          </div>
                        </div>
                        <p className="text-sm text-ledger-gray-500 whitespace-nowrap">
                          <span className="font-medium text-kx-text-primary">{(page * pageSize + 1).toLocaleString()}</span>
                          {'–'}
                          <span className="font-medium text-kx-text-primary">{Math.min((page + 1) * pageSize, total).toLocaleString()}</span>
                          {' of '}
                          <span className="font-medium text-kx-text-primary">{total.toLocaleString()}</span>
                          {' documents'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(0)} disabled={page === 0} title="First page">
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => p - 1)} disabled={page === 0} title="Previous page">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {(() => {
                          const start = Math.max(0, page - 2)
                          const end = Math.min(Math.max(totalPages - 1, 0), page + 2)
                          const pages: number[] = []
                          for (let i = start; i <= end; i++) pages.push(i)
                          return (
                            <>
                              {start > 0 && <span className="text-xs text-ledger-gray-400 px-1">…</span>}
                              {pages.map(p => (
                                <Button key={p} variant={p === page ? 'primary' : 'ghost'} size="sm"
                                  onClick={() => setPage(p)}
                                  className={cn('h-8 w-8 p-0 text-xs font-medium', p === page && 'pointer-events-none')}>
                                  {p + 1}
                                </Button>
                              ))}
                              {end < totalPages - 1 && <span className="text-xs text-ledger-gray-400 px-1">…</span>}
                            </>
                          )
                        })()}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} title="Next page">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(Math.max(totalPages - 1, 0))} disabled={page >= totalPages - 1} title="Last page">
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT TOOLS PANEL ── */}
      {toolsPanelOpen ? (
        <div className="w-56 flex-shrink-0 border-l border-kx-card-border bg-nb-panel flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-nb-panel-border flex-shrink-0">
            <h3 className="text-base font-bold text-kx-text-primary">Tools</h3>
            <button
              type="button"
              onClick={() => setToolsPanelOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-nb-text-muted hover:text-kx-text-primary hover:bg-nb-sidebar-hover transition-colors flex-shrink-0"
              title="Close Tools"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>
          {/* Tool cards */}
          <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1">
            {TOOLS.map(tool => {
              const Icon = tool.icon
              const isDisabled = tool.id === 'merge' && viewerOpen
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => !isDisabled && handleToolClick(tool.id)}
                  disabled={isDisabled}
                  title={isDisabled ? 'Select multiple documents to merge' : undefined}
                  className={cn(
                    'flex flex-col items-start gap-2 px-3 py-3 rounded-xl border bg-nb-sidebar text-left w-full transition-all',
                    isDisabled
                      ? 'border-ledger-gray-200 opacity-40 cursor-not-allowed'
                      : 'border-kx-primary-200 hover:border-kx-primary-400 hover:bg-nb-sidebar-hover cursor-pointer group'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', tool.iconBg)}>
                      <Icon className={cn('h-4 w-4', tool.iconColor)} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-kx-text-primary group-hover:text-kx-primary-700 leading-tight">
                      {tool.label}
                    </p>
                    <p className="text-[10px] text-ledger-gray-400 mt-0.5 leading-snug">{tool.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div
          className="w-7 flex-shrink-0 border-l border-kx-card-border bg-kx-surface flex items-center justify-center cursor-pointer hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 transition-colors group"
          onClick={() => setToolsPanelOpen(true)}
          title="Open Tools"
        >
          <span className="text-[9px] font-medium uppercase tracking-widest text-ledger-gray-300 group-hover:text-ledger-gray-500 select-none transition-colors"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Tools
          </span>
        </div>
      )}

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

      {/* Assign to case dialog */}
      <Dialog open={assignDocId !== null} onOpenChange={open => { if (!open) { setAssignDocId(null); setAssignCaseId('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign to case</DialogTitle>
            <DialogDescription>Select a case to link this document to.</DialogDescription>
          </DialogHeader>
          <Select value={assignCaseId} onChange={e => setAssignCaseId(e.target.value)} searchable searchPlaceholder="Search cases...">
            <option value="">Select a case…</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAssignDocId(null); setAssignCaseId('') }} disabled={isAssigning}>Cancel</Button>
            <Button onClick={handleAssignToCase} disabled={!assignCaseId || isAssigning} className="gap-1.5">
              {isAssigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

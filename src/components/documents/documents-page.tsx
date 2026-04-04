import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Upload, Scissors, RefreshCw, Minimize2, Layers,
  FileText, File, MoreHorizontal, Download, FolderInput,
  Trash2, Loader2, PenLine, Languages, Scale,
  BookOpen, ChevronUp, ChevronDown, X,
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
  docProcessingApi,
} from '@/services/api/doc-processing-api'
import { workspaceApi } from '@/services/api/workspace-api'
import { caseApi } from '@/services/api/case-api'
import { apiClient, ApiError } from '@/services/api/api-client'
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
import type {
  DocumentRecord,
  DocumentRecordType,
  ProcessedDocumentInfo,
} from '@/services/api/doc-processing-api'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'type' | 'case' | 'date'
type ActiveToolId = null | 'split' | 'merge' | 'convert' | 'compress' | 'translation'
type DocRowAction = 'download' | 'assign' | 'split' | 'convert' | 'compress' | 'translate' | 'delete'
type AssignmentFilter = 'unassigned' | 'assigned' | 'all'
type TypeFilter = 'ALL' | DocumentRecordType

interface ToolContext {
  id: ActiveToolId
  initialDoc?: ProcessedDocumentInfo
  initialDocs?: ProcessedDocumentInfo[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function toProcessedDoc(doc: DocumentRecord): ProcessedDocumentInfo {
  return {
    id: doc.id,
    fileName: doc.originalFilename || doc.name,
    fileSize: 0,
    pageCount: 0,
    downloadUrl: doc.downloadUrl ?? undefined,
  }
}

// ─── Type metadata ────────────────────────────────────────────────────────────

const TYPE_META: Record<DocumentRecordType, {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  USER_UPLOADED: {
    label: 'Uploaded',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    icon: File,
  },
  DRAFT: {
    label: 'Draft',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    icon: PenLine,
  },
  SUMMARY: {
    label: 'Summary',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: FileText,
  },
  JUDGMENT: {
    label: 'Judgment',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    icon: Scale,
  },
}

// ─── Tool definitions (no drafting) ──────────────────────────────────────────

const TOOLS: { id: Exclude<ActiveToolId, null>; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: 'split',       label: 'Split PDF',    icon: Scissors,  description: 'Extract pages from a PDF' },
  { id: 'merge',       label: 'Merge PDFs',   icon: Layers,    description: 'Combine multiple PDFs' },
  { id: 'convert',     label: 'Convert',      icon: RefreshCw, description: 'PDF, images, text' },
  { id: 'compress',    label: 'Compress PDF', icon: Minimize2, description: 'Reduce file size' },
  { id: 'translation', label: 'Translate',    icon: Languages, description: 'Translate documents' },
]

// ─── SortHeader ───────────────────────────────────────────────────────────────

function SortHeader({
  col, label, sortKey, sortDir, onSort,
}: {
  col: SortKey
  label: string
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (col: SortKey) => void
}) {
  const isActive = sortKey === col
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={cn(
        'flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors select-none',
        isActive
          ? 'text-kx-primary-600 dark:text-kx-primary-400'
          : 'text-ledger-gray-400 hover:text-kx-text-primary'
      )}
    >
      {label}
      <span className="ml-0.5">
        {isActive
          ? sortDir === 'asc'
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />
          : <ChevronDown className="h-3 w-3 opacity-30" />
        }
      </span>
    </button>
  )
}

// ─── DocTableRow ──────────────────────────────────────────────────────────────

function DocTableRow({
  doc, selected, onSelect, onAction, checked, onCheck,
}: {
  doc: DocumentRecord
  selected: boolean
  onSelect: () => void
  onAction: (action: DocRowAction) => void
  checked: boolean
  onCheck: (checked: boolean) => void
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

  const meta = TYPE_META[doc.type]
  const Icon = meta.icon
  const displayName = doc.originalFilename || doc.name
  const caseLabel = doc.caseTitle ?? 'Standalone'
  const isStandalone = !doc.caseId
  const isPdf = doc.fileType === 'PDF'
  const canDownload = !!(doc.downloadUrl || doc.storageUrl)
  const isUpload = doc.type === 'USER_UPLOADED'

  const menuItems: { label: string; icon: React.ComponentType<{ className?: string }>; action: DocRowAction; danger?: boolean }[] = [
    ...(canDownload ? [{ label: 'Download', icon: Download, action: 'download' as const }] : []),
    ...(isUpload && isStandalone ? [{ label: 'Assign to Case', icon: FolderInput, action: 'assign' as const }] : []),
    ...(isUpload && isPdf ? [
      { label: 'Split PDF', icon: Scissors, action: 'split' as const },
      { label: 'Compress', icon: Minimize2, action: 'compress' as const },
    ] : []),
    ...(isUpload ? [{ label: 'Convert', icon: RefreshCw, action: 'convert' as const }] : []),
    { label: 'Translate', icon: Languages, action: 'translate' as const },
    ...(isUpload ? [{ label: 'Delete', icon: Trash2, action: 'delete' as const, danger: true }] : []),
  ]

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group grid items-center gap-3 px-4 py-2 border-b border-ledger-gray-100 dark:border-ledger-gray-800',
        'cursor-pointer transition-colors last:border-0',
        'grid-cols-[24px_1fr_72px_100px_60px_28px]',
        selected
          ? 'bg-kx-primary-50 dark:bg-kx-primary-950/20 border-l-2 border-l-kx-primary-500'
          : checked
            ? 'bg-kx-primary-50/50 dark:bg-kx-primary-950/10'
            : 'hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/40'
      )}
    >
      {/* Checkbox */}
      <div onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onCheck(!checked)}
          className={cn(
            'h-4 w-4 rounded border flex items-center justify-center transition-colors',
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

      {/* Name */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded bg-ledger-gray-100 dark:bg-ledger-gray-800">
          <Icon className="h-3.5 w-3.5 text-ledger-gray-500 dark:text-ledger-gray-400" />
        </div>
        <span className="truncate text-sm font-medium text-kx-text-primary leading-none">
          {displayName}
        </span>
      </div>

      {/* Type badge */}
      <div>
        <span className={cn(
          'inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide',
          meta.className
        )}>
          {meta.label}
        </span>
      </div>

      {/* Case */}
      <span className={cn(
        'text-xs truncate',
        isStandalone ? 'text-ledger-gray-400 italic' : 'text-ledger-gray-500'
      )}>
        {caseLabel}
      </span>

      {/* Date */}
      <span className="text-xs text-ledger-gray-400 tabular-nums text-right">
        {formatRelativeTime(doc.createdAt)}
      </span>

      {/* Actions menu */}
      {menuItems.length > 0 ? (
        <div
          ref={menuRef}
          className="relative flex justify-end"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            className="flex h-7 w-7 items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-700 bg-kx-card shadow-lg py-1">
              {menuItems.map(item => {
                const ItemIcon = item.icon
                return (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => { setMenuOpen(false); onAction(item.action) }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      item.danger
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-kx-text-primary hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800'
                    )}
                  >
                    <ItemIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : <div />}
    </div>
  )
}

// ─── DocumentViewer ───────────────────────────────────────────────────────────

function DocumentViewer({
  doc, onClose, onOpenTool,
}: {
  doc: DocumentRecord
  onClose: () => void
  onOpenTool: (id: ActiveToolId, ctx?: Omit<ToolContext, 'id'>) => void
}) {
  const [viewerMode, setViewerMode] = useState<'view' | 'text-edit' | 'pdf-edit'>('view')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // PDF edit state
  const [pdfOp, setPdfOp] = useState<'remove-pages' | 'add-text'>('remove-pages')
  const [removePageInput, setRemovePageInput] = useState('')
  const [overlayText, setOverlayText] = useState('')
  const [overlayX, setOverlayX] = useState('50')
  const [overlayY, setOverlayY] = useState('50')
  const [overlayFontSize, setOverlayFontSize] = useState('12')
  const [overlayPage, setOverlayPage] = useState('1')
  const [isApplying, setIsApplying] = useState(false)
  const [editResult, setEditResult] = useState<ProcessedDocumentInfo | null>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const formatting = useEditorFormatting(editorRef, () => setIsDirty(true))

  const displayName = doc.originalFilename || doc.name
  const meta = TYPE_META[doc.type]
  const Icon = meta.icon
  const isTextual = doc.type === 'DRAFT' || doc.type === 'SUMMARY'
  const isPdf = doc.fileType === 'PDF'
  const isImage = !isPdf && /\.(png|jpe?g)$/i.test(doc.name)
  const isDraft = doc.type === 'DRAFT'
  const isUploadedPdf = doc.type === 'USER_UPLOADED' && isPdf
  const canDownload = !!(doc.downloadUrl || doc.storageUrl)

  useEffect(() => {
    let cancelled = false
    setBlobUrl(null)
    setTextContent(null)
    setViewerMode('view')
    setIsDirty(false)
    setEditResult(null)
    setIsLoadingContent(true)

    async function load() {
      try {
        if (isTextual) {
          const text = await workspaceApi.fetchDocumentContent({
            id: doc.id,
            signedUrl: doc.storageUrl,
            downloadUrl: doc.downloadUrl,
          })
          if (!cancelled) setTextContent(text)
        } else {
          const url = await workspaceApi.resolveDocumentUrl({
            id: doc.id,
            downloadUrl: doc.downloadUrl,
            signedUrl: doc.storageUrl,
          })
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
  }, [doc.id, doc.downloadUrl, doc.storageUrl, isTextual])

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [blobUrl])

  const handleEdit = () => {
    if (isDraft && textContent !== null) {
      if (editorRef.current) editorRef.current.innerHTML = renderDraftToHtml(textContent)
      setViewerMode('text-edit')
    } else if (isUploadedPdf) {
      setRemovePageInput('')
      setOverlayText('')
      setOverlayX('50'); setOverlayY('50')
      setOverlayFontSize('12'); setOverlayPage('1')
      setEditResult(null)
      setViewerMode('pdf-edit')
    }
  }

  const handleSave = async () => {
    if (!editorRef.current) return
    setIsSaving(true)
    try {
      const content = editorRef.current.innerHTML
      await apiClient.put(`/api/v1/documents/${doc.id}/content`, { content })
      setIsDirty(false)
      toast({ title: 'Saved' })
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => { setViewerMode('view'); setIsDirty(false) }

  const handleApplyPdfEdit = async () => {
    setIsApplying(true)
    try {
      let res
      if (pdfOp === 'remove-pages') {
        const pageNumbers = removePageInput
          .split(/[,\s]+/)
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n) && n > 0)
        if (pageNumbers.length === 0) {
          toast({ title: 'Enter at least one page number', variant: 'destructive' })
          return
        }
        res = await docProcessingApi.editPdf({
          documentId: doc.id,
          caseId: doc.caseId ?? null,
          removePages: { pageNumbers },
        })
      } else {
        if (!overlayText.trim()) {
          toast({ title: 'Enter text to overlay', variant: 'destructive' })
          return
        }
        res = await docProcessingApi.editPdf({
          documentId: doc.id,
          caseId: doc.caseId ?? null,
          addTextOverlay: {
            text: overlayText,
            x: Number(overlayX) || 50,
            y: Number(overlayY) || 50,
            fontSize: Number(overlayFontSize) || 12,
            pageNumber: Number(overlayPage) || null,
          },
        })
      }
      setEditResult(res.data?.document ?? null)
      toast({ title: 'Edit applied', description: 'New document created.' })
    } catch (e) {
      toast({
        title: 'Edit failed',
        description: e instanceof Error ? e.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsApplying(false)
    }
  }

  const handleDownload = async () => {
    try {
      if (doc.downloadUrl) await downloadDocument(doc.downloadUrl, displayName)
      else if (doc.storageUrl) triggerDirectDownload(doc.storageUrl, displayName)
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-kx-card-border flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 flex-shrink-0 text-ledger-gray-400" />
        <span className="flex-1 min-w-0 text-sm font-medium text-kx-text-primary truncate">
          {displayName}
        </span>
        <span className={cn(
          'flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide',
          meta.className
        )}>
          {meta.label}
        </span>
        {canDownload && viewerMode === 'view' && (
          <button
            type="button"
            onClick={handleDownload}
            title="Download"
            className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      {isDraft && (
        <FormattingToolbar
          isEditing={viewerMode === 'text-edit'}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          onBold={formatting.handleBold}
          onItalic={formatting.handleItalic}
          onUnderline={formatting.handleUnderline}
          onAlignLeft={formatting.handleAlignLeft}
          onAlignCenter={formatting.handleAlignCenter}
          onAlignRight={formatting.handleAlignRight}
          onBulletList={formatting.handleBulletList}
          onNumberedList={formatting.handleNumberedList}
          onFontSize={formatting.handleFontSize}
          isSaving={isSaving}
          hasChanges={isDirty}
        />
      )}

      {isUploadedPdf && viewerMode === 'view' && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-kx-card-border flex-shrink-0">
          <Button size="sm" onClick={handleEdit} className="gap-1.5 h-7 text-xs">
            <Scissors className="h-3.5 w-3.5" />
            Edit PDF
          </Button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-auto relative">
        {isLoadingContent ? (
          <div className="flex items-center justify-center h-full py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ledger-gray-400" />
          </div>
        ) : viewerMode === 'text-edit' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setIsDirty(true)}
            className="h-full w-full p-6 outline-none text-sm text-kx-text-primary leading-relaxed"
          />
        ) : viewerMode === 'pdf-edit' ? (
          <div className="p-6 space-y-5 max-w-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-kx-primary-900">Edit PDF</h3>
              <button type="button" onClick={handleCancelEdit} className="text-ledger-gray-400 hover:text-kx-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-3">
              {(['remove-pages', 'add-text'] as const).map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setPdfOp(op)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors',
                    pdfOp === op
                      ? 'border-kx-primary-500 bg-kx-primary-50 text-kx-primary-700 dark:bg-kx-primary-950/30'
                      : 'border-kx-card-border text-ledger-gray-600 hover:border-kx-primary-300'
                  )}
                >
                  {op === 'remove-pages' ? 'Remove Pages' : 'Add Text Overlay'}
                </button>
              ))}
            </div>
            {pdfOp === 'remove-pages' && (
              <div>
                <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">
                  Page numbers to remove <span className="font-normal">(e.g. 1, 3, 5)</span>
                </label>
                <input
                  type="text"
                  value={removePageInput}
                  onChange={e => setRemovePageInput(e.target.value)}
                  placeholder="1, 3, 5"
                  className="w-full h-9 px-3 text-sm border border-kx-card-border rounded-lg bg-kx-card text-kx-text-primary focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
                />
              </div>
            )}
            {pdfOp === 'add-text' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Text</label>
                  <input
                    type="text"
                    value={overlayText}
                    onChange={e => setOverlayText(e.target.value)}
                    placeholder="Text to add"
                    className="w-full h-9 px-3 text-sm border border-kx-card-border rounded-lg bg-kx-card text-kx-text-primary focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Page', value: overlayPage, set: setOverlayPage, placeholder: '1' },
                    { label: 'X pos', value: overlayX, set: setOverlayX, placeholder: '50' },
                    { label: 'Y pos', value: overlayY, set: setOverlayY, placeholder: '50' },
                  ].map(({ label, value, set, placeholder }) => (
                    <div key={label}>
                      <label className="text-xs font-medium text-ledger-gray-500 mb-1 block">{label}</label>
                      <input
                        type="number"
                        value={value}
                        onChange={e => set(e.target.value)}
                        placeholder={placeholder}
                        className="w-full h-8 px-2 text-sm border border-kx-card-border rounded-lg bg-kx-card text-kx-text-primary focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-ledger-gray-500 mb-1.5 block">Font size</label>
                  <input
                    type="number"
                    value={overlayFontSize}
                    onChange={e => setOverlayFontSize(e.target.value)}
                    placeholder="12"
                    className="w-24 h-8 px-2 text-sm border border-kx-card-border rounded-lg bg-kx-card text-kx-text-primary focus:outline-none focus:ring-1 focus:ring-kx-primary-400"
                  />
                </div>
              </div>
            )}
            {editResult ? (
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-sm text-emerald-600 font-medium">Edit applied — new document created.</p>
                <Button
                  size="sm"
                  className="gap-1.5 w-fit"
                  onClick={() => downloadDocument(editResult.downloadUrl ?? editResult.id, editResult.fileName)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Result
                </Button>
                <Button size="sm" variant="ghost" className="w-fit" onClick={handleCancelEdit}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleApplyPdfEdit} disabled={isApplying} className="gap-1.5">
                  {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Apply Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isApplying}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ) : isTextual && textContent !== null ? (
          <div
            className="p-6 prose prose-sm max-w-none text-kx-text-primary"
            dangerouslySetInnerHTML={{ __html: renderDraftToHtml(textContent) }}
          />
        ) : blobUrl && (isPdf || doc.type === 'JUDGMENT') ? (
          <iframe
            src={blobUrl}
            className="w-full h-full border-0"
            title={displayName}
          />
        ) : blobUrl && isImage ? (
          <div className="flex items-center justify-center p-6 h-full">
            <img src={blobUrl} alt={displayName} className="max-w-full max-h-full object-contain rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <FileText className="h-10 w-10 text-ledger-gray-300" />
            <p className="text-sm font-medium text-kx-text-primary">Preview not available</p>
            {canDownload && (
              <Button size="sm" variant="ghost" className="border border-kx-card-border gap-1.5" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                Download file
              </Button>
            )}
            {doc.type === 'USER_UPLOADED' && doc.fileType === 'PDF' && (
              <Button
                size="sm"
                variant="ghost"
                className="border border-kx-card-border gap-1.5"
                onClick={() => onOpenTool('split', { initialDoc: toProcessedDoc(doc) })}
              >
                <Scissors className="h-3.5 w-3.5" />
                Split PDF
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Upload dialog ────────────────────────────────────────────────────────────

function UploadDialog({
  open, onOpenChange, onUploaded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUploaded: () => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [docType, setDocType] = useState<DocumentRecordType>('USER_UPLOADED')
  const [caseId, setCaseId] = useState('')
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    caseApi.getAll({ size: 50 }).then(res => {
      const content = res.data?.content ?? []
      setCases(content.map(c => ({
        id: c.id,
        label: c.title || c.caseNumber || c.id,
      })))
    }).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open) {
      setFiles([])
      setCaseId('')
      setDocType('USER_UPLOADED')
      setIsDragging(false)
    }
  }, [open])

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    setFiles(prev => [...prev, ...Array.from(incoming)])
  }

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)
    try {
      await Promise.all(
        files.map(f => uploadToolboxFile(f, {
          type: docType,
          caseId: caseId || undefined,
        }))
      )
      toast({ title: `${files.length} file${files.length > 1 ? 's' : ''} uploaded` })
      onOpenChange(false)
      onUploaded()
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
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
            isDragging
              ? 'border-kx-primary-400 bg-kx-primary-50 dark:bg-kx-primary-950/20'
              : 'border-kx-card-border hover:border-kx-primary-300 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/40'
          )}
        >
          <Upload className="h-7 w-7 mx-auto mb-2 text-ledger-gray-400" />
          <p className="text-sm font-medium text-kx-text-primary">Drop files here or click to browse</p>
          <p className="text-xs text-ledger-gray-400 mt-1">PDF, PNG, JPG supported</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-800 text-xs max-w-full"
              >
                <span className="truncate max-w-[160px] text-kx-text-primary">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-full text-ledger-gray-400 hover:text-red-500 hover:bg-ledger-gray-200 dark:hover:bg-ledger-gray-700 transition-colors"
                >
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
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toolCtx, setToolCtx] = useState<ToolContext>({ id: null })
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Filters
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('unassigned')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Assign dialog
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; doc: DocumentRecord | null }>({
    open: false, doc: null,
  })

  const { setSidebarCollapsed } = useUIState()
  const prevSidebarCollapsedRef = useRef<boolean | null>(null)

  const selectedDoc = allDocs.find(d => d.id === selectedDocId) ?? null
  const viewerOpen = selectedDocId !== null && toolCtx.id === null

  // Auto-collapse sidebar when viewer opens
  useEffect(() => {
    if (viewerOpen) {
      if (prevSidebarCollapsedRef.current === null) {
        // We don't know the previous state, so we just collapse
        prevSidebarCollapsedRef.current = false
      }
      setSidebarCollapsed(true)
    } else if (prevSidebarCollapsedRef.current !== null) {
      setSidebarCollapsed(prevSidebarCollapsedRef.current)
      prevSidebarCollapsedRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen])

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const { documents: data } = await listAllDocuments()
      setAllDocs(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Filtering
  const filteredDocs = allDocs.filter(d => {
    // Assignment filter
    if (assignmentFilter === 'unassigned' && d.caseId) return false
    if (assignmentFilter === 'assigned' && !d.caseId) return false
    // Type filter
    if (typeFilter !== 'ALL' && d.type !== typeFilter) return false
    return true
  })

  // Sorting
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    const val = (d: DocumentRecord): string => ({
      name: (d.originalFilename ?? d.name).toLowerCase(),
      type: d.type,
      case: d.caseTitle ?? '',
      date: d.createdAt,
    }[sortKey])
    const cmp = val(a).localeCompare(val(b))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const handleSort = (col: SortKey) => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('asc') }
  }

  const toggleDocCheck = (docId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      checked ? next.add(docId) : next.delete(docId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedDocs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedDocs.map(d => d.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectedPdfs = sortedDocs.filter(d => selectedIds.has(d.id) && d.fileType === 'PDF')

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(ids.map(id => apiClient.delete(`/api/v1/documents/${id}`)))
      toast({ title: `${ids.length} document${ids.length > 1 ? 's' : ''} deleted` })
      clearSelection()
      refresh()
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  const openTool = (id: ActiveToolId, ctx?: Omit<ToolContext, 'id'>) => {
    setSelectedDocId(null)
    setToolCtx({ id, ...ctx })
  }

  const closeTool = () => { setToolCtx({ id: null }); refresh() }
  const closeViewer = () => setSelectedDocId(null)

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      if (doc.downloadUrl) await downloadDocument(doc.downloadUrl, doc.name)
      else if (doc.storageUrl) triggerDirectDownload(doc.storageUrl, doc.originalFilename || doc.name)
      else toast({ title: 'Download not available' })
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' })
    }
  }

  const handleDelete = async (doc: DocumentRecord) => {
    try {
      await apiClient.delete(`/api/v1/documents/${doc.id}`)
      toast({ title: 'Document deleted' })
      refresh()
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  const handleRowAction = (doc: DocumentRecord, action: DocRowAction) => {
    if (action === 'download')  { handleDownload(doc); return }
    if (action === 'delete')    { handleDelete(doc); return }
    if (action === 'assign')    { setAssignDialog({ open: true, doc }); return }
    if (action === 'split')     { openTool('split',       { initialDoc: toProcessedDoc(doc) }); return }
    if (action === 'convert')   { openTool('convert',     { initialDoc: toProcessedDoc(doc) }); return }
    if (action === 'compress')  { openTool('compress',    { initialDoc: toProcessedDoc(doc) }); return }
    if (action === 'translate') { openTool('translation',  { initialDoc: toProcessedDoc(doc) }); return }
  }

  const showTable = !isLoading && !error && sortedDocs.length > 0

  // Tool dialog content renderer
  const renderToolDialog = (toolId: Exclude<ActiveToolId, null>) => {
    switch (toolId) {
      case 'split':       return <SplitterDialog    onBack={closeTool} initialDoc={toolCtx.initialDoc} />
      case 'merge':       return <MergerDialog      onBack={closeTool} initialDocs={toolCtx.initialDocs} />
      case 'convert':     return <ConverterDialog   onBack={closeTool} initialDoc={toolCtx.initialDoc} />
      case 'compress':    return <CompressorDialog   onBack={closeTool} initialDoc={toolCtx.initialDoc} />
      case 'translation': return <TranslationDialog  onBack={closeTool} />
      default:            return null
    }
  }

  return (
    <div className="px-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900 dark:text-kx-primary-100">
          Documents
        </h1>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>

      {/* Tool toolbar — horizontal pills */}
      <div className="flex items-center gap-2 mb-4">
        {TOOLS.map(tool => {
          const ToolIcon = tool.icon
          const isActive = toolCtx.id === tool.id
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => isActive ? closeTool() : openTool(tool.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                isActive
                  ? 'bg-kx-primary-600 text-white border-kx-primary-600 shadow-sm'
                  : 'bg-kx-card text-ledger-gray-600 dark:text-ledger-gray-300 border-kx-card-border hover:border-kx-primary-300 hover:text-kx-primary-700 dark:hover:text-kx-primary-400'
              )}
            >
              <ToolIcon className="h-3.5 w-3.5" />
              {tool.label}
            </button>
          )
        })}
      </div>

      {/* Filter bar — dropdowns */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-ledger-gray-400 uppercase tracking-wide">Show:</span>
          <Select
            value={assignmentFilter}
            onChange={e => setAssignmentFilter(e.target.value as AssignmentFilter)}
          >
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            <option value="all">All Documents</option>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-ledger-gray-400 uppercase tracking-wide">Type:</span>
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TypeFilter)}
          >
            <option value="ALL">All Types</option>
            <option value="USER_UPLOADED">Uploaded</option>
            <option value="DRAFT">Draft</option>
            <option value="SUMMARY">Summary</option>
            <option value="JUDGMENT">Judgment</option>
          </Select>
        </div>
      </div>

      {/* Main content area */}
      <div
        className="flex items-stretch -mx-6 border-t border-kx-card-border"
        style={{ minHeight: 'calc(100vh - 230px)' }}
      >
        {/* Document list */}
        <div className={cn(
          'flex flex-col min-w-0 overflow-hidden',
          viewerOpen ? 'w-[400px] flex-shrink-0 border-r border-kx-card-border' : 'flex-1'
        )}>
          {/* Contextual action bar when items selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-kx-primary-50 dark:bg-kx-primary-950/30 border-b border-kx-primary-200 dark:border-kx-primary-800 flex-shrink-0">
              <span className="text-sm font-medium text-kx-primary-700 dark:text-kx-primary-300">
                {selectedIds.size} selected
              </span>
              {selectedPdfs.length >= 2 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 h-7 text-xs border border-kx-card-border"
                  onClick={() => {
                    const docs = selectedPdfs.map(toProcessedDoc)
                    clearSelection()
                    openTool('merge', { initialDocs: docs })
                  }}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Merge
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 h-7 text-xs border border-kx-card-border"
                onClick={() => {
                  const doc = sortedDocs.find(d => selectedIds.has(d.id))
                  if (doc) {
                    setAssignDialog({ open: true, doc })
                  }
                }}
              >
                <FolderInput className="h-3.5 w-3.5" />
                Assign
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 h-7 text-xs text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-auto h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Column headers */}
          {showTable && selectedIds.size === 0 && (
            <div className="grid grid-cols-[24px_1fr_72px_100px_60px_28px] items-center gap-3 px-4 py-2 border-b border-kx-card-border bg-ledger-gray-50 dark:bg-ledger-gray-900/20 flex-shrink-0">
              <button
                type="button"
                onClick={toggleSelectAll}
                className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                  selectedIds.size === sortedDocs.length && sortedDocs.length > 0
                    ? 'bg-kx-primary-600 border-kx-primary-600 text-white'
                    : 'border-ledger-gray-300 dark:border-ledger-gray-600 hover:border-kx-primary-400'
                )}
              >
                {selectedIds.size === sortedDocs.length && sortedDocs.length > 0 && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <SortHeader col="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortHeader col="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortHeader col="case" label="Case" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortHeader col="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <div />
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
                <Button variant="ghost" size="sm" onClick={refresh}>Try again</Button>
              </div>
            ) : sortedDocs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
                <BookOpen className="h-8 w-8 text-ledger-gray-300" />
                <p className="font-medium text-kx-primary-900 dark:text-kx-primary-100">No documents found</p>
                <p className="text-sm text-ledger-gray-400">Try adjusting your filters or upload a new document.</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1 border border-kx-card-border gap-1.5"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload a file
                </Button>
              </div>
            ) : (
              <div>
                {sortedDocs.map(doc => (
                  <DocTableRow
                    key={doc.id}
                    doc={doc}
                    selected={selectedDocId === doc.id}
                    onSelect={() => setSelectedDocId(doc.id)}
                    onAction={action => handleRowAction(doc, action)}
                    checked={selectedIds.has(doc.id)}
                    onCheck={checked => toggleDocCheck(doc.id, checked)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Document viewer — right side */}
        {viewerOpen && selectedDoc && (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <DocumentViewer
              doc={selectedDoc}
              onClose={closeViewer}
              onOpenTool={openTool}
            />
          </div>
        )}
      </div>

      {/* Tool modal dialogs */}
      {TOOLS.map(tool => (
        <Dialog
          key={tool.id}
          open={toolCtx.id === tool.id}
          onOpenChange={open => { if (!open) closeTool() }}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            {toolCtx.id === tool.id && renderToolDialog(tool.id)}
          </DialogContent>
        </Dialog>
      ))}

      {/* Upload dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploaded={refresh}
      />

      {/* Assign case dialog */}
      <AssignCaseDialog
        open={assignDialog.open}
        onOpenChange={v => { if (!v) setAssignDialog({ open: false, doc: null }) }}
        document={assignDialog.doc ? toProcessedDoc(assignDialog.doc) : null}
        onAssigned={() => { refresh(); setAssignDialog({ open: false, doc: null }) }}
      />
    </div>
  )
}

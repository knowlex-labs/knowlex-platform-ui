import { useState, useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Save,
  Download,
  Printer,
  FileText,
  ChevronDown,
  Pencil,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormattingToolbarProps {
  isEditing?: boolean
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onAlignLeft: () => void
  onAlignCenter: () => void
  onAlignRight: () => void
  onBulletList: () => void
  onNumberedList: () => void
  onFontSize: (size: string) => void
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  onPrint?: () => void
  onDownloadDoc?: () => void
  onDownloadPdf?: () => void
  onDownloadMd?: () => void
  isSaving?: boolean
  hasChanges?: boolean
  documentTitle?: string
  className?: string
}

const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '24'] as const

export function FormattingToolbar({
  isEditing = false,
  onBold,
  onItalic,
  onUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onBulletList,
  onNumberedList,
  onFontSize,
  onEdit,
  onSave,
  onCancel,
  onPrint,
  onDownloadDoc,
  onDownloadPdf,
  onDownloadMd,
  isSaving,
  hasChanges,
  documentTitle,
  className,
}: FormattingToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

  const hasExportOptions = onPrint || onDownloadDoc || onDownloadPdf || onDownloadMd

  const exportDropdown = (
    <div className="relative flex-shrink-0" ref={exportRef}>
      <button
        onClick={() => setExportOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
          'text-ledger-gray-600 hover:bg-ledger-gray-100',
          exportOpen && 'bg-ledger-gray-100'
        )}
        title="Export options"
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className={cn('h-3 w-3 transition-transform', exportOpen && 'rotate-180')} />
      </button>

      {exportOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-nb-panel rounded-lg shadow-lg border border-nb-panel-border py-1 z-50">
          {onPrint && (
            <button
              onClick={() => { onPrint(); setExportOpen(false) }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-ledger-gray-700 hover:bg-ledger-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4 text-ledger-gray-400" />
              Print
            </button>
          )}
          {onDownloadPdf && (
            <button
              onClick={() => { onDownloadPdf(); setExportOpen(false) }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-ledger-gray-700 hover:bg-ledger-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-red-400" />
              Download PDF
            </button>
          )}
          {onDownloadDoc && (
            <button
              onClick={() => { onDownloadDoc(); setExportOpen(false) }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-ledger-gray-700 hover:bg-ledger-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-blue-500" />
              Download Word
            </button>
          )}
          {onDownloadMd && (
            <button
              onClick={() => { onDownloadMd(); setExportOpen(false) }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-ledger-gray-700 hover:bg-ledger-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              Download Markdown
            </button>
          )}
        </div>
      )}
    </div>
  )

  const barBase = cn(
    'flex items-center gap-0.5 px-3 py-1.5 border-b border-ledger-gray-200 flex-shrink-0',
    className
  )
  const divider = <div className="w-px h-4 bg-ledger-gray-200 mx-1 flex-shrink-0" />
  const btnBase = 'p-1.5 rounded hover:bg-ledger-gray-100 text-ledger-gray-600 transition-colors flex-shrink-0'

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className={barBase}>
        <div className="flex-1 min-w-0">
          {documentTitle && (
            <h3 className="text-sm font-medium text-kx-primary-900 truncate">
              {documentTitle}
            </h3>
          )}
        </div>

        {hasExportOptions && exportDropdown}

        {onEdit && (
          <button
            onClick={onEdit}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ml-0.5',
              'bg-kx-primary-600 hover:bg-kx-primary-700 text-white'
            )}
            title="Edit document"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <div className={barBase}>
      <button onClick={onBold} className={btnBase} title="Bold (Ctrl+B)">
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button onClick={onItalic} className={btnBase} title="Italic (Ctrl+I)">
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button onClick={onUnderline} className={btnBase} title="Underline (Ctrl+U)">
        <Underline className="h-3.5 w-3.5" />
      </button>

      {divider}

      <button onClick={onAlignLeft} className={btnBase} title="Align Left">
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button onClick={onAlignCenter} className={btnBase} title="Align Center">
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button onClick={onAlignRight} className={btnBase} title="Align Right">
        <AlignRight className="h-3.5 w-3.5" />
      </button>

      {divider}

      <select
        onChange={(e) => onFontSize(e.target.value)}
        className="h-7 px-1.5 text-xs border border-ledger-gray-200 rounded hover:bg-ledger-gray-50 bg-nb-input text-ledger-gray-700 focus:outline-none focus:ring-1 focus:ring-ledger-gray-300 flex-shrink-0"
        defaultValue="12"
        title="Font Size"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}pt
          </option>
        ))}
      </select>

      {divider}

      <button onClick={onBulletList} className={btnBase} title="Bullet List">
        <List className="h-3.5 w-3.5" />
      </button>
      <button onClick={onNumberedList} className={btnBase} title="Numbered List">
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <div className="flex-1" />

      {/* Save status */}
      <span
        className={cn(
          'text-xs font-medium mr-2 transition-colors flex-shrink-0',
          isSaving
            ? 'text-ledger-gray-400'
            : hasChanges
              ? 'text-amber-500'
              : 'text-ledger-gray-400'
        )}
      >
        {isSaving ? 'Saving…' : hasChanges ? 'Unsaved' : 'Saved'}
      </span>

      {hasExportOptions && exportDropdown}

      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ml-0.5 flex-shrink-0',
            isSaving
              ? 'text-ledger-gray-400 cursor-not-allowed'
              : hasChanges
                ? 'bg-kx-primary-600 hover:bg-kx-primary-700 text-white'
                : 'text-ledger-gray-500 hover:bg-ledger-gray-100'
          )}
          title="Save (Ctrl+S)"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-ledger-gray-500 hover:bg-ledger-gray-100 transition-colors flex-shrink-0"
          title="Cancel editing"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      )}
    </div>
  )
}

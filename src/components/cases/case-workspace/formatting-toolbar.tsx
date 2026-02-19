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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormattingToolbarProps {
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onAlignLeft: () => void
  onAlignCenter: () => void
  onAlignRight: () => void
  onBulletList: () => void
  onNumberedList: () => void
  onFontSize: (size: string) => void
  onSave?: () => void
  isSaving?: boolean
  hasChanges?: boolean
  className?: string
}

const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '24'] as const

export function FormattingToolbar({
  onBold,
  onItalic,
  onUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onBulletList,
  onNumberedList,
  onFontSize,
  onSave,
  isSaving,
  hasChanges,
  className,
}: FormattingToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-4 py-2 border-b border-ledger-gray-200 dark:border-ledger-gray-700',
        className
      )}
    >
      <button
        onClick={onBold}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={onItalic}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onClick={onUnderline}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-ledger-gray-300 dark:bg-ledger-gray-600 mx-1" />

      <button
        onClick={onAlignLeft}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        onClick={onAlignCenter}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        onClick={onAlignRight}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-ledger-gray-300 dark:bg-ledger-gray-600 mx-1" />

      <select
        onChange={(e) => onFontSize(e.target.value)}
        className="h-8 px-2 text-sm border border-ledger-gray-200 dark:border-ledger-gray-600 rounded hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-700 dark:bg-ledger-gray-800 dark:text-ledger-gray-300 focus:outline-none focus:ring-1 focus:ring-ledger-gray-300"
        defaultValue="12"
        title="Font Size"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}pt
          </option>
        ))}
      </select>

      <div className="w-px h-5 bg-ledger-gray-300 dark:bg-ledger-gray-600 mx-1" />

      <button
        onClick={onBulletList}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={onNumberedList}
        className="p-2 rounded hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 dark:text-ledger-gray-300 transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      {/* Spacer pushes Save to the right */}
      <div className="flex-1" />

      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
            isSaving
              ? 'text-ledger-gray-400 dark:text-ledger-gray-500 cursor-not-allowed'
              : hasChanges
                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950'
                : 'text-ledger-gray-500 dark:text-ledger-gray-400 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700'
          )}
          title="Save (Ctrl+S)"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      )}
    </div>
  )
}

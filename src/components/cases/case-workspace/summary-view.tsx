import { useCallback } from 'react'
import { Loader2, RefreshCw, Trash2, Download, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CaseSummary } from '@/types'

interface SummaryViewProps {
  summary: CaseSummary | null
  isGenerating: boolean
  onRegenerate: () => void
  onDelete: () => void
}

export function SummaryView({ summary, isGenerating, onRegenerate, onDelete }: SummaryViewProps) {
  const isPending = isGenerating || summary?.status === 'pending'
  const isFailed = !isGenerating && summary?.status === 'failed'
  const isReady = !isPending && !isFailed && summary?.status === 'completed'

  const handleDownload = useCallback(() => {
    if (!summary?.content) return
    const blob = new Blob([summary.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'case-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [summary?.content])

  return (
    <div className="flex flex-col h-full bg-kx-card overflow-hidden">
      {/* Toolbar — matches FormattingToolbar style */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-ledger-gray-200 dark:border-ledger-gray-700">
        <div className="flex-1" />

        <button
          onClick={onRegenerate}
          disabled={isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
            isPending
              ? 'text-ledger-gray-400 dark:text-ledger-gray-500 cursor-not-allowed'
              : 'text-ledger-gray-600 dark:text-ledger-gray-300 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700'
          )}
          title="Regenerate summary"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isPending ? 'Generating...' : 'Regenerate'}
        </button>

        {isReady && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors text-ledger-gray-600 dark:text-ledger-gray-300 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700"
            title="Download summary"
          >
            <Download className="h-4 w-4" />
            Save
          </button>
        )}

        <button
          onClick={onDelete}
          disabled={isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
            isPending
              ? 'text-ledger-gray-300 dark:text-ledger-gray-600 cursor-not-allowed'
              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
          )}
          title="Delete summary"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-ledger-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-kx-primary-400" />
            <p className="text-sm">Generating summary...</p>
            <p className="text-xs text-ledger-gray-400">This may take a moment</p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-500">Summary generation failed.</p>
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-ledger-gray-600 hover:bg-ledger-gray-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : isReady ? (
          <div className="max-w-3xl mx-auto px-8 py-8">
            <div className="text-sm text-kx-primary-900 leading-relaxed whitespace-pre-wrap font-sans">
              {summary!.content}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

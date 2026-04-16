import { Brain, ExternalLink } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { AIResearchItem } from '@knowlex/core/types'

interface ResearchSummaryProps {
  items: AIResearchItem[]
}

const relevanceColors = {
  high: 'bg-kx-primary-600 text-ledger-white',
  medium: 'bg-ledger-gray-500 text-ledger-white',
  low: 'bg-ledger-gray-200 text-ledger-gray-700',
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function ResearchSummary({ items }: ResearchSummaryProps) {
  return (
    <div className="border border-ledger-gray-200 rounded">
      <div className="px-4 py-3 border-b border-ledger-gray-200 bg-ledger-gray-50">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-ledger-gray-500" />
          <h3 className="text-sm font-medium text-kx-primary-900">
            AI Research
          </h3>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-ledger-gray-500 text-center py-8">
              No research items linked to this case yet.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="border border-ledger-gray-200 rounded p-4 hover:border-ledger-gray-300 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm uppercase',
                      relevanceColors[item.relevance]
                    )}
                  >
                    {item.relevance}
                  </span>
                  <span className="text-xs text-ledger-gray-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-medium text-kx-primary-900 mb-2">
                  {item.title}
                </h4>

                {/* Summary */}
                <p className="text-xs text-ledger-gray-600 leading-relaxed mb-3">
                  {item.summary}
                </p>

                {/* Source */}
                <div className="flex items-center gap-1 text-xs text-ledger-gray-500 mb-3">
                  <ExternalLink className="h-3 w-3" />
                  <span>{item.source}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 text-xs bg-ledger-gray-100 text-ledger-gray-600 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

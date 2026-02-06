import {
  FileText,
  FileOutput,
  ListChecks,
  Scale,
  PenLine,
  Loader2,
} from 'lucide-react'
import { LEGAL_TOOLS } from '@/types'
import { cn } from '@/lib/utils'

interface ToolsPanelProps {
  selectedSourceCount: number
  isLoading: boolean
  onExecuteTool: (toolId: string) => Promise<void>
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  FileOutput,
  ListChecks,
  Scale,
  PenLine,
}

export function ToolsPanel({
  selectedSourceCount,
  isLoading,
  onExecuteTool,
}: ToolsPanelProps) {
  const isDisabled = selectedSourceCount === 0 || isLoading

  return (
    <div className="flex flex-col h-full bg-ledger-white border border-ledger-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ledger-gray-200">
        <h3 className="text-sm font-semibold text-ledger-black">Tools</h3>
      </div>

      {/* Tools List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {selectedSourceCount === 0 && (
          <p className="text-xs text-ledger-gray-400 text-center py-4">
            Select sources to use tools
          </p>
        )}

        {LEGAL_TOOLS.map((tool) => {
          const Icon = iconMap[tool.icon] ?? FileText
          return (
            <button
              key={tool.id}
              onClick={() => onExecuteTool(tool.id)}
              disabled={isDisabled}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                isDisabled
                  ? 'border-ledger-gray-100 bg-ledger-gray-50 cursor-not-allowed opacity-60'
                  : 'border-ledger-gray-200 hover:border-ledger-gray-300 hover:bg-ledger-gray-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded flex items-center justify-center',
                    isDisabled ? 'bg-ledger-gray-100' : 'bg-ledger-gray-100'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-ledger-gray-400" />
                  ) : (
                    <Icon className="h-4 w-4 text-ledger-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ledger-black">
                    {tool.name}
                  </p>
                  <p className="text-xs text-ledger-gray-500 mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-ledger-gray-200 bg-ledger-gray-50">
        <p className="text-xs text-ledger-gray-500 text-center">
          Tools analyze your selected sources
        </p>
      </div>
    </div>
  )
}

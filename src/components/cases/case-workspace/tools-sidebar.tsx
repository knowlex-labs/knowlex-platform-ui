import { PenLine, FileOutput, FileText, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ToolsSidebarProps {
  onDraftingClick: () => void
  onGenerateReport: () => void
  onGenerateSummary: () => void
  onGenerateFacts: () => void
  selectedSourceCount: number
}

const tools = [
  {
    id: 'drafting',
    name: 'Drafting',
    description: 'Create legal documents',
    icon: PenLine,
  },
  {
    id: 'generate-report',
    name: 'Generate Report',
    description: 'Legal analysis report',
    icon: FileOutput,
  },
  {
    id: 'generate-summary',
    name: 'Generate Summary',
    description: 'Summarize documents',
    icon: FileText,
  },
  {
    id: 'generate-facts',
    name: 'Generate Facts',
    description: 'Extract key facts',
    icon: ListChecks,
  },
]

export function ToolsSidebar({
  onDraftingClick,
  onGenerateReport,
  onGenerateSummary,
  onGenerateFacts,
  selectedSourceCount,
}: ToolsSidebarProps) {
  const handleToolClick = (toolId: string) => {
    switch (toolId) {
      case 'drafting':
        onDraftingClick()
        break
      case 'generate-report':
        onGenerateReport()
        break
      case 'generate-summary':
        onGenerateSummary()
        break
      case 'generate-facts':
        onGenerateFacts()
        break
    }
  }

  const isDisabled = (toolId: string) => {
    // Drafting doesn't require selected sources
    if (toolId === 'drafting') return false
    // Other tools require at least one selected source
    return selectedSourceCount === 0
  }

  return (
    <div className="flex flex-col h-full bg-ledger-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ledger-gray-200">
        <h3 className="text-sm font-semibold text-ledger-black">Tools</h3>
      </div>

      {/* Tools List */}
      <div className="flex-1 p-3 space-y-2">
        {tools.map((tool) => {
          const Icon = tool.icon
          const disabled = isDisabled(tool.id)

          return (
            <Button
              key={tool.id}
              variant="outline"
              className={cn(
                'w-full justify-start gap-3 h-auto py-3 px-3',
                disabled && 'opacity-50'
              )}
              onClick={() => handleToolClick(tool.id)}
              disabled={disabled}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded bg-ledger-gray-100 flex items-center justify-center">
                <Icon className="h-4 w-4 text-ledger-gray-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-ledger-black">
                  {tool.name}
                </p>
                <p className="text-xs text-ledger-gray-500">
                  {tool.description}
                </p>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-ledger-gray-200 bg-ledger-gray-50">
        <p className="text-xs text-ledger-gray-500">
          {selectedSourceCount > 0 ? (
            <>{selectedSourceCount} source{selectedSourceCount !== 1 ? 's' : ''} selected</>
          ) : (
            <>Select sources to use tools</>
          )}
        </p>
      </div>
    </div>
  )
}

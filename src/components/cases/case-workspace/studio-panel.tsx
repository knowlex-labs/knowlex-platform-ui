import { PenLine, FileOutput, FileText, ListChecks } from 'lucide-react'
import { StudioToolCard } from './studio-tool-card'

interface StudioPanelProps {
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
    icon: PenLine,
    requiresSources: false,
  },
  {
    id: 'generate-report',
    name: 'Report',
    icon: FileOutput,
    requiresSources: true,
  },
  {
    id: 'generate-summary',
    name: 'Summary',
    icon: FileText,
    requiresSources: true,
  },
  {
    id: 'generate-facts',
    name: 'Key Facts',
    icon: ListChecks,
    requiresSources: true,
  },
]

export function StudioPanel({
  onDraftingClick,
  onGenerateReport,
  onGenerateSummary,
  onGenerateFacts,
  selectedSourceCount,
}: StudioPanelProps) {
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

  return (
    <div className="flex flex-col h-full bg-ledger-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-medium text-ledger-gray-600">Tools</h3>
        {selectedSourceCount > 0 && (
          <p className="text-xs text-ledger-gray-400 mt-1">
            {selectedSourceCount} source{selectedSourceCount !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Tool Grid - 1 column */}
      <div className="flex-1 px-4 pb-4">
        <div className="flex flex-col gap-2">
          {tools.map((tool) => (
            <StudioToolCard
              key={tool.id}
              id={tool.id}
              name={tool.name}
              icon={tool.icon}
              disabled={tool.requiresSources && selectedSourceCount === 0}
              onClick={() => handleToolClick(tool.id)}
              onEditClick={
                tool.id === 'drafting'
                  ? () => handleToolClick(tool.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

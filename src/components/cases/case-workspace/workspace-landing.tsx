import { PenLine, FileText, ListChecks, FileOutput, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceLandingProps {
  onDraftingClick: () => void
}

const tools = [
  {
    id: 'drafting',
    name: 'Drafts',
    description: 'Create legal documents from templates with AI assistance',
    icon: PenLine,
    locked: false,
  },
  {
    id: 'summary',
    name: 'Summary',
    description: 'Generate concise summaries from your case documents',
    icon: FileText,
    locked: true,
  },
  {
    id: 'key-facts',
    name: 'Key Facts',
    description: 'Extract important facts and details from sources',
    icon: ListChecks,
    locked: true,
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Build comprehensive legal analysis reports',
    icon: FileOutput,
    locked: true,
  },
]

export function WorkspaceLanding({ onDraftingClick }: WorkspaceLandingProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-kx-primary-900">
            What would you like to do?
          </h2>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Choose a tool to get started with your case
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={tool.locked ? undefined : onDraftingClick}
                disabled={tool.locked}
                className={cn(
                  'relative flex flex-col items-center gap-3 p-6 rounded-xl border transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-kx-primary-500',
                  tool.locked
                    ? 'border-ledger-gray-200 bg-ledger-gray-50/50 opacity-60 cursor-not-allowed'
                    : 'border-ledger-gray-200 bg-white hover:border-kx-primary-300 hover:shadow-md hover:bg-kx-primary-50/30 cursor-pointer'
                )}
              >
                {tool.locked && (
                  <div className="absolute top-3 right-3">
                    <Lock className="h-3.5 w-3.5 text-ledger-gray-400" />
                  </div>
                )}
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    tool.locked
                      ? 'bg-ledger-gray-100 text-ledger-gray-400'
                      : 'bg-kx-primary-100 text-kx-primary-600'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-kx-primary-900 block">
                    {tool.name}
                  </span>
                  {tool.locked && (
                    <span className="text-xs text-ledger-gray-400 mt-0.5 block">
                      Coming Soon
                    </span>
                  )}
                  {!tool.locked && (
                    <span className="text-xs text-ledger-gray-500 mt-0.5 block">
                      {tool.description}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

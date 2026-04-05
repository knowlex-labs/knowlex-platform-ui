import { PanelRightClose, FileText, Clock, Gavel, MessageSquare, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tool {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  title: string
  description: string
  onClick: () => void
}

interface Section {
  label: string
  tools: Tool[]
}

interface CaseStudioPanelProps {
  onClose: () => void
  onGenerateSummary: () => void
  onSendToChat: (message: string) => void
  onFindPrecedents: () => void
  sourceCount: number
}

export function CaseStudioPanel({
  onClose,
  onGenerateSummary,
  onSendToChat,
  onFindPrecedents,
}: CaseStudioPanelProps) {
  const sections: Section[] = [
    {
      label: 'ANALYSIS',
      tools: [
        {
          icon: FileText,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50 dark:bg-blue-950/40',
          title: 'Case Synopsis',
          description: 'Generate a 1-page summary of all facts and claims.',
          onClick: onGenerateSummary,
        },
        {
          icon: Clock,
          iconColor: 'text-violet-600',
          iconBg: 'bg-violet-50 dark:bg-violet-950/40',
          title: 'Timeline Extraction',
          description: 'Extract a chronological timeline of events from sources.',
          onClick: () => onSendToChat('Extract a chronological timeline of all key events from the uploaded documents.'),
        },
      ],
    },
    {
      label: 'DRAFTING',
      tools: [
        {
          icon: Gavel,
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
          title: 'Argument Generator',
          description: 'Draft legal arguments based on uploaded documents.',
          onClick: () => onSendToChat('Draft strong legal arguments based on the facts and documents in this case.'),
        },
        {
          icon: MessageSquare,
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-50 dark:bg-orange-950/40',
          title: 'Draft Reply',
          description: 'Create a response to the latest notice or petition.',
          onClick: () => onSendToChat('Draft a formal legal reply to the most recent notice or petition in this case.'),
        },
      ],
    },
    {
      label: 'RESEARCH',
      tools: [
        {
          icon: Search,
          iconColor: 'text-rose-600',
          iconBg: 'bg-rose-50 dark:bg-rose-950/40',
          title: 'Find Precedents',
          description: 'Search legal library for similar case laws.',
          onClick: onFindPrecedents,
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-full bg-kx-card">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-kx-card-border flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="h-4 w-4 text-kx-primary-600" />
            <h3 className="text-sm font-semibold text-kx-text-primary">Case Studio</h3>
          </div>
          <p className="text-xs text-ledger-gray-400 leading-snug">One-click AI actions for this case</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-ledger-gray-400 hover:text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors flex-shrink-0 mt-0.5"
          title="Close Studio"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* Tool sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="px-4 py-2 text-[10px] font-semibold tracking-widest text-ledger-gray-400 uppercase">
              {section.label}
            </p>
            <div className="px-2 space-y-0.5">
              {section.tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <button
                    key={tool.title}
                    type="button"
                    onClick={tool.onClick}
                    className={cn(
                      'w-full text-left flex items-start gap-3 px-3 py-3 rounded-lg',
                      'transition-colors hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/60',
                      'group'
                    )}
                  >
                    <div className={cn(
                      'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5',
                      tool.iconBg
                    )}>
                      <Icon className={cn('h-4 w-4', tool.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-kx-text-primary leading-snug group-hover:text-kx-primary-700 dark:group-hover:text-kx-primary-400 transition-colors">
                        {tool.title}
                      </p>
                      <p className="text-xs text-ledger-gray-400 leading-snug mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

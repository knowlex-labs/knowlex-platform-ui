import { PenLine, Upload, FileText, Scale } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface WorkspaceLandingProps {
  onDraftingClick: () => void
  onSummaryClick: () => void
  onUploadDocumentsClick: () => void
  onLinkJudgmentClick: () => void
  compact?: boolean
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const suggestions = [
  { icon: PenLine, label: 'Start a new draft', description: 'Generate legal documents using AI templates', action: 'drafting' },
  { icon: Upload,  label: 'Upload documents',  description: 'Add case files, evidence, and references', action: 'upload'   },
  { icon: Scale,   label: 'Link judgment',     description: 'Attach relevant court judgments', action: 'judgment' },
  { icon: FileText, label: 'Generate summary', description: 'AI-powered case overview from your sources', action: 'summary'  },
]

export function WorkspaceLanding({ onDraftingClick, onSummaryClick, onUploadDocumentsClick, onLinkJudgmentClick, compact = false }: WorkspaceLandingProps) {
  const { user } = useAuth()
  const displayName = user?.firstName || user?.username || 'Advocate'

  const handleAction = (action: string) => {
    if (action === 'drafting') onDraftingClick()
    else if (action === 'upload') onUploadDocumentsClick()
    else if (action === 'judgment') onLinkJudgmentClick()
    else if (action === 'summary') onSummaryClick()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">

      {/* Greeting — only in main center position */}
      {!compact && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-kx-primary-900">
            {getGreeting()}, {displayName}
          </h2>
          <p className="text-sm text-ledger-gray-400 mt-2">
            What would you like to work on today?
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
        {suggestions.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.action}
              onClick={() => handleAction(s.action)}
              className="flex flex-col items-start gap-2.5 p-5 rounded-xl border border-ledger-gray-200 bg-kx-card text-left hover:border-kx-primary-400 hover:shadow-md transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-kx-primary-50 dark:bg-kx-primary-900/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-kx-primary-600" />
              </div>
              <span className="text-sm font-semibold text-kx-primary-900">{s.label}</span>
              <span className="text-xs text-ledger-gray-500 leading-relaxed">{s.description}</span>
            </button>
          )
        })}
      </div>

    </div>
  )
}

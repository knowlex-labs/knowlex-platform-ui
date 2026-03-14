import { PenLine, Upload, FileText, Scale } from 'lucide-react'

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
  { icon: PenLine, label: 'Start a new draft', action: 'drafting' },
  { icon: Upload,  label: 'Upload documents',  action: 'upload'   },
  { icon: Scale,   label: 'Link judgment',     action: 'judgment' },
  { icon: FileText, label: 'Generate summary', action: 'summary'  },
]

export function WorkspaceLanding({ onDraftingClick, onSummaryClick, onUploadDocumentsClick, onLinkJudgmentClick, compact = false }: WorkspaceLandingProps) {
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
            {getGreeting()}, Advocate
          </h2>
          <p className="text-sm text-ledger-gray-400 mt-2">
            What would you like to work on today?
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {suggestions.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.action}
              onClick={() => handleAction(s.action)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-ledger-gray-200 bg-kx-card text-sm text-kx-primary-800 hover:border-kx-primary-400 hover:bg-kx-primary-50 transition-all"
            >
              <Icon className="h-3.5 w-3.5 text-kx-primary-500" />
              {s.label}
            </button>
          )
        })}
      </div>

    </div>
  )
}

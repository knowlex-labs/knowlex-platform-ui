import { Brain } from 'lucide-react'
import type { ChatSession } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface LatestResearchWidgetProps {
  sessions: ChatSession[]
  isLoading: boolean
  onSessionClick: () => void
}

export function LatestResearchWidget({
  sessions,
  isLoading,
  onSessionClick,
}: LatestResearchWidgetProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-kx-card-border rounded-lg p-4 animate-pulse"
          >
            <div className="h-4 bg-ledger-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-ledger-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-ledger-gray-300 rounded-lg">
        <Brain className="h-12 w-12 text-ledger-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-ledger-gray-900 mb-1">
          No research sessions yet
        </h3>
        <p className="text-sm text-ledger-gray-500 mb-4">
          Start your first AI research session
        </p>
        <button
          onClick={onSessionClick}
          className="text-sm text-kx-primary-600 font-medium hover:underline"
        >
          Start Research
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.slice(0, 5).map((session) => (
        <button
          key={session.id}
          onClick={onSessionClick}
          className="w-full border border-kx-card-border bg-kx-card rounded-lg p-4 text-left shadow-sm card-elevated focus:outline-none focus:ring-2 focus:ring-ledger-gray-400 focus:ring-offset-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ledger-gray-900 truncate mb-1">
                {session.title}
              </p>
              <p className="text-xs text-ledger-gray-500">
                {session.messages.length} message
                {session.messages.length !== 1 ? 's' : ''}
              </p>
            </div>
            <p className="text-xs text-ledger-gray-400 flex-shrink-0">
              {formatDistanceToNow(session.createdAt, { addSuffix: true })}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

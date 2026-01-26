import { Brain } from 'lucide-react'
import { DashboardCard } from './dashboard-card'
import { useNavigation } from '@/contexts/navigation-context'
import type { ChatSession } from '@/types'

interface LatestResearchWidgetProps {
  sessions: ChatSession[]
  isLoading: boolean
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function LatestResearchWidget({
  sessions,
  isLoading,
}: LatestResearchWidgetProps) {
  const { setActiveTab } = useNavigation()

  if (isLoading) {
    return (
      <DashboardCard
        title="Recent AI Research"
        icon={Brain}
        action={{ label: 'See All', onClick: () => setActiveTab('ai-research') }}
      >
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-ledger-gray-100 rounded w-3/4 mb-1" />
              <div className="h-3 bg-ledger-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Recent AI Research"
      icon={Brain}
      action={{ label: 'See All', onClick: () => setActiveTab('ai-research') }}
    >
      {sessions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-ledger-gray-500">No research sessions yet</p>
          <button
            onClick={() => setActiveTab('ai-research')}
            className="mt-2 text-sm text-ledger-black hover:underline"
          >
            Start your first research
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <div
              key={session.id}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ledger-black truncate">
                  {session.title}
                </p>
                <p className="text-xs text-ledger-gray-500">
                  {session.messages.length} message
                  {session.messages.length !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-xs text-ledger-gray-400 flex-shrink-0">
                {formatDate(session.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}

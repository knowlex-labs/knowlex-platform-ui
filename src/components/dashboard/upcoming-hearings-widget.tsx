import { Calendar } from 'lucide-react'
import { DashboardCard } from './dashboard-card'
import { useNavigation } from '@/contexts/navigation-context'
import type { Case } from '@/types'

interface UpcomingHearingsWidgetProps {
  cases: Case[]
  isLoading: boolean
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getRelativeDate(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 0) return 'Overdue'
  if (days <= 7) return `In ${days} days`
  return formatDate(date)
}

export function UpcomingHearingsWidget({
  cases,
  isLoading,
}: UpcomingHearingsWidgetProps) {
  const { setActiveTab } = useNavigation()

  // Filter cases with upcoming hearings and sort by date
  const upcomingHearings = cases
    .filter((c) => c.nextHearingDate)
    .sort(
      (a, b) =>
        (a.nextHearingDate?.getTime() ?? 0) - (b.nextHearingDate?.getTime() ?? 0)
    )
    .slice(0, 5)

  if (isLoading) {
    return (
      <DashboardCard
        title="Upcoming Hearings"
        icon={Calendar}
        action={{ label: 'See All', onClick: () => setActiveTab('cases') }}
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
      title="Upcoming Hearings"
      icon={Calendar}
      action={{ label: 'See All', onClick: () => setActiveTab('cases') }}
    >
      {upcomingHearings.length === 0 ? (
        <p className="text-sm text-ledger-gray-500 text-center py-4">
          No upcoming hearings
        </p>
      ) : (
        <div className="space-y-3">
          {upcomingHearings.map((caseItem) => (
            <div
              key={caseItem.id}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ledger-black truncate">
                  {caseItem.caseTitle || 'Untitled Case'}
                </p>
                <p className="text-xs text-ledger-gray-500">
                  {caseItem.courtName || 'Court not specified'}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-medium text-ledger-black">
                  {caseItem.nextHearingDate &&
                    getRelativeDate(caseItem.nextHearingDate)}
                </p>
                <p className="text-xs text-ledger-gray-500">
                  {caseItem.nextHearingDate &&
                    formatDate(caseItem.nextHearingDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}

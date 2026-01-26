import { useAuth } from '@/contexts/auth-context'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { RecentCasesWidget } from './recent-cases-widget'
import { UpcomingHearingsWidget } from './upcoming-hearings-widget'
import { LatestResearchWidget } from './latest-research-widget'
import { LatestNewsWidget } from './latest-news-widget'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardHome() {
  const { user } = useAuth()
  const { cases, chatSessions, isLoading } = useDashboardData()

  const displayName = user?.firstName || user?.username || 'there'
  const greeting = getGreeting()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-ledger-black">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-ledger-gray-500 mt-1">
          Here's an overview of your practice
        </p>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <RecentCasesWidget cases={cases} isLoading={isLoading} />
        <UpcomingHearingsWidget cases={cases} isLoading={isLoading} />
        <LatestResearchWidget sessions={chatSessions} isLoading={isLoading} />
        <LatestNewsWidget />
      </div>
    </div>
  )
}

import { useAuth } from '@/contexts/auth-context'
import { useNavigation } from '@/contexts/navigation-context'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { ActiveCaseCards } from './active-case-cards'
import { QuickActionsBar } from './quick-actions-bar'
import { LatestResearchWidget } from './latest-research-widget'
import { LatestNewsWidget } from './latest-news-widget'
import { UpcomingHearingsWidget } from './upcoming-hearings-widget'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardHome() {
  const { user } = useAuth()
  const { setActiveTab, setSelectedCaseId, setShowAddCaseModal } = useNavigation()
  const { cases, chatSessions, isLoading } = useDashboardData()

  const displayName = user?.firstName || user?.username || 'there'
  const greeting = getGreeting()

  // Filter for active cases (active, pending, on-hold)
  const activeCases = cases.filter(
    (c) => c.status === 'active' || c.status === 'pending' || c.status === 'on-hold'
  )

  const handleCaseClick = (caseId: string) => {
    setSelectedCaseId(caseId)
    setActiveTab('cases')
  }

  const handleResearchClick = () => {
    setActiveTab('ai-research')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 md:gap-8">
      {/* Main Content - Left Column */}
      <div className="space-y-6 md:space-y-8">
        {/* Greeting Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Welcome back to your practice
          </p>
        </div>

        {/* Continue Where You Left Off - Active Cases */}
        <section>
          <h2 className="text-base font-semibold text-ledger-black mb-4">Continue where you left off</h2>
          <ActiveCaseCards
            cases={activeCases}
            isLoading={isLoading}
            onCaseClick={handleCaseClick}
          />
        </section>

        {/* Quick Actions */}
        <section>
          <QuickActionsBar
            onNewCase={() => {
              setShowAddCaseModal(true)
              setActiveTab('cases')
            }}
            onNewClient={() => setActiveTab('clients')}
            onResearch={() => setActiveTab('ai-research')}
          />
        </section>

        {/* Upcoming Hearings */}
        <section>
          <UpcomingHearingsWidget cases={cases} isLoading={isLoading} />
        </section>

        {/* Latest Research Sessions */}
        <section>
          <h2 className="text-base font-semibold text-ledger-black mb-4">Recent research</h2>
          <LatestResearchWidget
            sessions={chatSessions}
            isLoading={isLoading}
            onSessionClick={handleResearchClick}
          />
        </section>
      </div>

      {/* News Panel - Right Column */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <h2 className="text-base font-semibold text-ledger-black mb-4">Latest news</h2>
          <LatestNewsWidget />
        </div>
      </div>
    </div>
  )
}

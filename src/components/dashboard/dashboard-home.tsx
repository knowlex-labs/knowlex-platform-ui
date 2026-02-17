import { useAuth } from '@/contexts/auth-context'
import { useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { ActiveCaseCards } from './active-case-cards'
import { QuickActionsBar } from './quick-actions-bar'
import { LatestResearchWidget } from './latest-research-widget'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setShowAddCaseModal } = useUIState()
  const { cases, chatSessions, isLoading } = useDashboardData()

  const displayName = user?.firstName || user?.username || 'there'
  const greeting = getGreeting()

  // Filter for active cases (active, pending, on-hold)
  const activeCases = cases.filter(
    (c) => c.status === 'active' || c.status === 'pending' || c.status === 'on-hold'
  )

  const handleCaseClick = (caseId: string) => {
    navigate(`/cases/${caseId}`)
  }

  const handleResearchClick = () => {
    navigate('/ai-research')
  }

  return (
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

      {/* Quick Actions */}
      <section>
        <QuickActionsBar
          onNewCase={() => {
            setShowAddCaseModal(true)
            navigate('/cases')
          }}
          onNewClient={() => navigate('/clients')}
          onResearch={() => navigate('/ai-research')}
        />
      </section>

      {/* Continue Where You Left Off - Active Cases */}
      <section>
        <h2 className="text-base font-semibold text-ledger-black mb-4">Continue where you left off</h2>
        <ActiveCaseCards
          cases={activeCases}
          isLoading={isLoading}
          onCaseClick={handleCaseClick}
        />
      </section>

      {/* Recent Research */}
      <section>
        <h2 className="text-base font-semibold text-ledger-black mb-4">Recent research</h2>
        <LatestResearchWidget
          sessions={chatSessions}
          isLoading={isLoading}
          onSessionClick={handleResearchClick}
        />
      </section>
    </div>
  )
}

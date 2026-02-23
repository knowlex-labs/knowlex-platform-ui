import { Plus, UserPlus, CalendarClock, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { StatsOverview } from './stats-overview'
import { UpcomingHearingsWidget } from './upcoming-hearings-widget'
import { RecentClientsWidget } from './recent-clients-widget'
import { ContinueWhereLeftOff } from './continue-where-left-off'

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
  const { cases, clients, stats, isLoading } = useDashboardData()

  const displayName = user?.firstName || user?.username || 'there'
  const greeting = getGreeting()

  const handleCaseClick = (caseId: string) => {
    navigate(`/cases/${caseId}`)
  }

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-ledger-gray-500 mt-1">
          Here's an overview of your practice
        </p>
      </div>

      {/* Stats Overview */}
      <section>
        <StatsOverview
          totalCases={stats.totalCases}
          activeCases={stats.activeCases}
          totalClients={stats.totalClients}
          upcomingHearings={stats.upcomingHearings}
          isLoading={isLoading}
        />
      </section>

      {/* Two-column layout: Main content + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Main content — center */}
        <div className="flex-1 min-w-0 space-y-6 md:space-y-8">
          {/* Continue where you left off */}
          <section>
            <h2 className="text-base font-semibold text-kx-primary-900 mb-4">Continue where you left off</h2>
            <ContinueWhereLeftOff
              cases={cases}
              isLoading={isLoading}
              onCaseClick={handleCaseClick}
            />
          </section>

          {/* Recent Clients */}
          <section>
            <h2 className="text-base font-semibold text-kx-primary-900 mb-4">Recent clients</h2>
            <RecentClientsWidget
              clients={clients}
              isLoading={isLoading}
              onClientClick={handleClientClick}
            />
          </section>

          {/* Quick Actions */}
          <section>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowAddCaseModal(true)
                  navigate('/cases')
                }}
                className="bg-kx-card border border-kx-card-border rounded-lg p-4 shadow-sm card-elevated text-left animate-bounce-in"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-kx-primary-900">New Case</p>
                    <p className="text-xs text-ledger-gray-500">Start a new case file</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/clients')}
                className="bg-kx-card border border-kx-card-border rounded-lg p-4 shadow-sm card-elevated text-left animate-bounce-in"
                style={{ animationDelay: '60ms' }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-kx-primary-900">Add Client</p>
                    <p className="text-xs text-ledger-gray-500">Register a new client</p>
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Right sidebar — reminders & notifications */}
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* Upcoming Hearings */}
            <div className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-kx-primary-900">Upcoming Hearings</h2>
              </div>
              <UpcomingHearingsWidget
                cases={cases}
                isLoading={isLoading}
                onCaseClick={handleCaseClick}
              />
            </div>

            {/* Announcements / Reminders placeholder */}
            <div className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4 text-kx-primary-600" />
                <h2 className="text-sm font-semibold text-kx-primary-900">Reminders</h2>
              </div>
              <div className="text-center py-6">
                <Bell className="h-10 w-10 text-ledger-gray-300 mx-auto mb-2" />
                <p className="text-xs text-ledger-gray-500">No new reminders</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

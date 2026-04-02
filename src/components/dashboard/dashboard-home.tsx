import { useState, useEffect, useRef } from 'react'
import { Plus, UserPlus, CalendarDays, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics'
import { StatsOverview } from './stats-overview'
import { UpcomingHearingsWidget } from './upcoming-hearings-widget'
import { RecentClientsWidget } from './recent-clients-widget'
import { ContinueWhereLeftOff } from './continue-where-left-off'
import { LegalBytesWidget } from './legal-bytes-widget'

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
  const {
    aiStats,
    recentCases,
    recentClients,
    totalCases,
    totalClients,
    isLoading,
  } = useDashboardAnalytics()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const displayName = user?.firstName || user?.username || 'there'
  const greeting = getGreeting()

  const handleCaseClick = (caseId: string) => {
    navigate(`/cases/${caseId}`)
  }

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`)
  }

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [notifOpen])

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      {/* Header: greeting + quick actions + bell */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-serif font-semibold text-kx-primary-900">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Here's an overview of your practice
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              setShowAddCaseModal(true)
              navigate('/cases')
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-kx-primary-600 text-white hover:bg-kx-primary-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Case
          </button>
          <button
            onClick={() => navigate('/clients')}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-kx-card-border bg-kx-card text-kx-primary-900 hover:bg-ledger-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Add Client
          </button>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-kx-card-border bg-kx-card shadow-sm hover:bg-ledger-gray-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-kx-primary-700" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-11 w-72 bg-kx-card border border-kx-card-border rounded-xl shadow-lg p-4 z-50">
                <p className="text-sm font-semibold text-kx-primary-900 mb-3">Notifications</p>
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 text-ledger-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-ledger-gray-500">No new reminders</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile quick actions (visible on small screens) */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <button
          onClick={() => {
            setShowAddCaseModal(true)
            navigate('/cases')
          }}
          className="flex items-center gap-2 justify-center px-3 py-2.5 text-sm font-medium rounded-lg bg-kx-primary-600 text-white hover:bg-kx-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Case
        </button>
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 justify-center px-3 py-2.5 text-sm font-medium rounded-lg border border-kx-card-border bg-kx-card text-kx-primary-900 hover:bg-ledger-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Stats: Total Cases, Total Drafts Generated, Total Clients, Time Saved */}
      <section>
        <StatsOverview
          totalCases={totalCases}
          totalDraftsGenerated={aiStats.draftsGenerated}
          totalClients={totalClients}
          timeSaved={aiStats.timeSavedHours}
          isLoading={isLoading}
        />
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 lg:gap-6 min-w-0">

        {/* LEFT column */}
        <div className="space-y-5 min-w-0">
          {/* Upcoming Hearings */}
          <section className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              <h2 className="text-base font-semibold text-kx-primary-900">Upcoming Hearings</h2>
            </div>
            <UpcomingHearingsWidget />
          </section>

          {/* Continue where you left off */}
          <section className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-kx-primary-900 mb-4">Continue where you left off</h2>
            <ContinueWhereLeftOff
              cases={recentCases}
              isLoading={isLoading}
              onCaseClick={handleCaseClick}
            />
          </section>

          {/* Recent Clients */}
          <section className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-kx-primary-900 mb-4">Recent clients</h2>
            <RecentClientsWidget
              clients={recentClients}
              isLoading={isLoading}
              onClientClick={handleClientClick}
            />
          </section>
        </div>

        {/* RIGHT sidebar — Legal Bytes */}
        <aside>
          <div className="lg:sticky lg:top-6">
            <div className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
              <LegalBytesWidget />
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}

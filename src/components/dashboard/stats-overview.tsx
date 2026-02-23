import { Briefcase, Scale, Users, CalendarClock } from 'lucide-react'

interface StatsOverviewProps {
  totalCases: number
  activeCases: number
  totalClients: number
  upcomingHearings: number
  isLoading: boolean
}

const STATS_CONFIG = [
  {
    key: 'totalCases',
    label: 'Total Cases',
    icon: Briefcase,
    iconColors: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    key: 'activeCases',
    label: 'Active Cases',
    icon: Scale,
    iconColors: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    key: 'totalClients',
    label: 'Clients',
    icon: Users,
    iconColors: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    key: 'upcomingHearings',
    label: 'Upcoming Hearings',
    icon: CalendarClock,
    iconColors: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
] as const

export function StatsOverview({
  totalCases,
  activeCases,
  totalClients,
  upcomingHearings,
  isLoading,
}: StatsOverviewProps) {
  const values: Record<string, number> = {
    totalCases,
    activeCases,
    totalClients,
    upcomingHearings,
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS_CONFIG.map((stat, index) => (
        <div
          key={stat.key}
          className="bg-kx-card border border-kx-card-border rounded-lg p-4 shadow-sm animate-bounce-in"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconColors}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-7 w-12 bg-ledger-gray-200 rounded animate-pulse mb-0.5" />
              ) : (
                <p className="text-2xl font-bold text-kx-primary-900 leading-tight">
                  {values[stat.key]}
                </p>
              )}
              <p className="text-xs text-ledger-gray-500 truncate">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

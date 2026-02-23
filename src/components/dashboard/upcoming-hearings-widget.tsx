import { CalendarClock, MapPin } from 'lucide-react'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Case } from '@/types'

interface UpcomingHearingsWidgetProps {
  cases: Case[]
  isLoading: boolean
  onCaseClick: (caseId: string) => void
}

function getDateLabel(date: Date): { text: string; urgent: boolean } {
  if (isToday(date)) return { text: 'Today', urgent: true }
  if (isTomorrow(date)) return { text: 'Tomorrow', urgent: true }
  return { text: formatDistanceToNow(date, { addSuffix: true }), urgent: false }
}

export function UpcomingHearingsWidget({ cases, isLoading, onCaseClick }: UpcomingHearingsWidgetProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg p-3 animate-pulse bg-ledger-gray-50 dark:bg-ledger-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-ledger-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-3.5 bg-ledger-gray-200 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-ledger-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Filter cases with future hearing dates and sort by nearest first
  const now = new Date()
  const hearings = cases
    .filter((c) => c.nextHearingDate && new Date(c.nextHearingDate) >= now)
    .sort((a, b) => new Date(a.nextHearingDate!).getTime() - new Date(b.nextHearingDate!).getTime())
    .slice(0, 5)

  if (hearings.length === 0) {
    return (
      <div className="text-center py-6">
        <CalendarClock className="h-10 w-10 text-ledger-gray-300 mx-auto mb-2" />
        <p className="text-xs text-ledger-gray-500">No upcoming hearings</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {hearings.map((caseItem, index) => {
        const hearingDate = new Date(caseItem.nextHearingDate!)
        const { text: dateLabel, urgent } = getDateLabel(hearingDate)

        return (
          <button
            key={caseItem.id}
            onClick={() => onCaseClick(caseItem.id)}
            className={cn(
              'group w-full rounded-lg p-3 text-left transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-kx-primary-400 focus:ring-offset-1',
              'animate-bounce-in',
              urgent
                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20'
                : 'hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-100'
            )}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Date block */}
              <div className={cn(
                'flex flex-col items-center justify-center h-10 w-10 rounded-lg flex-shrink-0',
                urgent
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-ledger-gray-100 dark:bg-ledger-gray-200'
              )}>
                <span className={cn(
                  'text-base font-bold leading-none',
                  urgent ? 'text-amber-700 dark:text-amber-400' : 'text-kx-primary-900'
                )}>
                  {format(hearingDate, 'd')}
                </span>
                <span className={cn(
                  'text-[9px] font-medium uppercase',
                  urgent ? 'text-amber-600 dark:text-amber-500' : 'text-ledger-gray-500'
                )}>
                  {format(hearingDate, 'MMM')}
                </span>
              </div>

              {/* Case info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-kx-primary-900 group-hover:text-kx-primary-700 transition-colors truncate">
                  {caseItem.caseTitle || 'Untitled Case'}
                </p>
                {caseItem.courtName && (
                  <span className="flex items-center gap-1 text-[11px] text-ledger-gray-500 truncate mt-0.5">
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                    {caseItem.courtName}
                  </span>
                )}
                <span className={cn(
                  'inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1',
                  urgent
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-ledger-gray-100 text-ledger-gray-600 dark:bg-ledger-gray-200 dark:text-ledger-gray-400'
                )}>
                  {dateLabel}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

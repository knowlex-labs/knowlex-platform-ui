import { CalendarClock, MapPin, ArrowRight } from 'lucide-react'
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-ledger-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-ledger-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-ledger-gray-200 rounded w-3/4 mb-1.5" />
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
      <div className="text-center py-12 border border-dashed border-ledger-gray-300 rounded-lg">
        <CalendarClock className="h-12 w-12 text-ledger-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-ledger-gray-900 mb-1">No upcoming hearings</h3>
        <p className="text-sm text-ledger-gray-500">Hearing dates will appear here when scheduled</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {hearings.map((caseItem, index) => {
        const hearingDate = new Date(caseItem.nextHearingDate!)
        const { text: dateLabel, urgent } = getDateLabel(hearingDate)

        return (
          <button
            key={caseItem.id}
            onClick={() => onCaseClick(caseItem.id)}
            className={cn(
              'group w-full bg-kx-card border rounded-lg p-4 text-left shadow-sm card-elevated',
              'focus:outline-none focus:ring-2 focus:ring-kx-primary-400 focus:ring-offset-2',
              'animate-bounce-in',
              urgent
                ? 'border-amber-200 dark:border-amber-800'
                : 'border-kx-card-border'
            )}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-center gap-4">
              {/* Date block */}
              <div className={cn(
                'flex flex-col items-center justify-center h-12 w-12 rounded-lg flex-shrink-0',
                urgent
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-ledger-gray-100 dark:bg-ledger-gray-200'
              )}>
                <span className={cn(
                  'text-lg font-bold leading-none',
                  urgent ? 'text-amber-700 dark:text-amber-400' : 'text-kx-primary-900'
                )}>
                  {format(hearingDate, 'd')}
                </span>
                <span className={cn(
                  'text-[10px] font-medium uppercase',
                  urgent ? 'text-amber-600 dark:text-amber-500' : 'text-ledger-gray-500'
                )}>
                  {format(hearingDate, 'MMM')}
                </span>
              </div>

              {/* Case info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-kx-primary-900 group-hover:text-kx-primary-700 transition-colors truncate">
                  {caseItem.caseTitle || 'Untitled Case'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {caseItem.courtName && (
                    <span className="flex items-center gap-1 text-xs text-ledger-gray-500 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {caseItem.courtName}
                    </span>
                  )}
                  {caseItem.caseNumber && (
                    <span className="text-xs text-ledger-gray-400 truncate">
                      {caseItem.caseNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Date label + arrow */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  urgent
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-ledger-gray-100 text-ledger-gray-600 dark:bg-ledger-gray-200 dark:text-ledger-gray-400'
                )}>
                  {dateLabel}
                </span>
                <ArrowRight className="h-4 w-4 text-ledger-gray-300 group-hover:text-kx-primary-500 transition-colors" />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, MapPin, Gavel, ArrowRight } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'
import { dashboardApi } from '@knowlex/core/api'
import type { UpcomingHearing } from '@knowlex/core/api'
import { formatJudgeName } from '@knowlex/core/utils'

function getDateLabel(date: Date): { text: string; urgent: boolean } {
  if (isToday(date)) return { text: 'Today', urgent: true }
  if (isTomorrow(date)) return { text: 'Tomorrow', urgent: true }
  return { text: format(date, 'dd MMM'), urgent: false }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (s?: string | null) => !!s && UUID_RE.test(s.trim())

export function UpcomingHearingsWidget() {
  const navigate = useNavigate()
  const [hearings, setHearings] = useState<UpcomingHearing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      try {
        const res = await dashboardApi.getUpcomingHearings()
        if (!cancelled && res.status === 'success') {
          setHearings(res.data)
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

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

  if (hearings.length === 0) {
    return (
      <div className="text-center py-6">
        <CalendarClock className="h-10 w-10 text-ledger-gray-300 mx-auto mb-2" />
        <p className="text-xs text-ledger-gray-500">No upcoming hearings</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-1.5">
        {hearings.slice(0, 5).map((hearing, index) => {
          if (!hearing.nextHearingDate) return null
          const hearingDate = new Date(hearing.nextHearingDate)
          if (isNaN(hearingDate.getTime())) return null
          const { text: dateLabel, urgent } = getDateLabel(hearingDate)

          return (
            <button
              type="button"
              key={hearing.id}
              onClick={() => navigate(`/cases/${hearing.id}`)}
              className={cn(
                'w-full text-left rounded-lg p-3 animate-bounce-in transition-colors hover:ring-1 hover:ring-kx-primary-300 focus:outline-none focus:ring-2 focus:ring-kx-primary-400',
                urgent
                  ? 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100/70'
                  : 'bg-ledger-gray-50 dark:bg-ledger-gray-100 hover:bg-ledger-gray-100'
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

                {/* Hearing info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-kx-primary-900 truncate">
                    {hearing.caseTitle || hearing.caseNumber}
                  </p>
                  <p className="text-[10px] text-ledger-gray-400 truncate mt-0.5">{hearing.caseNumber}</p>
                  <span className="flex items-center gap-1 text-[11px] text-ledger-gray-500 truncate mt-0.5">
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                    {hearing.courtName}{hearing.courtLocation && !isUuid(hearing.courtLocation) ? ` · ${hearing.courtLocation}` : ''}
                  </span>
                  {hearing.judgeName && (
                    <span className="flex items-center gap-1 text-[11px] text-ledger-gray-500 truncate mt-0.5">
                      <Gavel className="h-2.5 w-2.5 flex-shrink-0" />
                      {formatJudgeName(hearing.judgeName)}
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

      <button
        onClick={() => navigate('/cause-lists')}
        className="flex items-center gap-1 text-xs font-medium text-kx-primary-600 hover:text-kx-primary-700 mt-3 transition-colors"
      >
        View all hearings
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}

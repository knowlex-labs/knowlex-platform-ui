import { Briefcase, ArrowRight, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { RecentCase } from '@/services/api/dashboard-api'

interface ContinueWhereLeftOffProps {
  cases: RecentCase[]
  isLoading: boolean
  onCaseClick: (caseId: string) => void
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ON_HOLD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CLOSED: 'bg-ledger-gray-100 text-ledger-gray-600 dark:bg-ledger-gray-200 dark:text-ledger-gray-400',
  APPEALED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function formatStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, ' ')
}

export function ContinueWhereLeftOff({ cases, isLoading, onCaseClick }: ContinueWhereLeftOffProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
            <div className="h-8 w-8 bg-ledger-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-3.5 bg-ledger-gray-200 rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-ledger-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-ledger-gray-300 rounded-lg">
        <Briefcase className="h-8 w-8 text-ledger-gray-400 mx-auto mb-2" />
        <p className="text-sm text-ledger-gray-500">Your recent cases will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {cases.map((caseItem, index) => (
        <button
          key={caseItem.id}
          onClick={() => onCaseClick(caseItem.id)}
          className={cn(
            'group w-full flex items-center gap-3 p-3 rounded-lg text-left',
            'hover:bg-kx-primary-50 dark:hover:bg-kx-primary-900/10 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-kx-primary-400 focus:ring-offset-1',
            'animate-bounce-in'
          )}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-kx-primary-100 text-kx-primary-700">
            <Scale className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-kx-primary-900 group-hover:text-kx-primary-700 truncate leading-tight">
              {caseItem.caseTitle || 'Untitled Case'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {caseItem.caseNumber && (
                <span className="text-xs text-ledger-gray-400 truncate">{caseItem.caseNumber}</span>
              )}
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize flex-shrink-0',
                statusColors[caseItem.caseStatus] || statusColors.ACTIVE
              )}>
                {formatStatus(caseItem.caseStatus)}
              </span>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-ledger-gray-300 group-hover:text-kx-primary-500 transition-colors flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}

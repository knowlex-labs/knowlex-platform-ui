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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="border border-ledger-gray-200 rounded-lg p-5 animate-pulse">
            <div className="h-4 bg-ledger-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-ledger-gray-200 rounded w-1/2 mb-4" />
            <div className="flex gap-2">
              <div className="h-5 bg-ledger-gray-200 rounded-full w-16" />
              <div className="h-5 bg-ledger-gray-200 rounded-full w-14" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-ledger-gray-300 rounded-lg">
        <Briefcase className="h-12 w-12 text-ledger-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-ledger-gray-900 mb-1">No active cases</h3>
        <p className="text-sm text-ledger-gray-500">Your recent cases will appear here</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {cases.map((caseItem, index) => (
        <button
          key={caseItem.id}
          onClick={() => onCaseClick(caseItem.id)}
          className={cn(
            'group w-full bg-kx-card border border-kx-card-border rounded-lg p-5 text-left shadow-sm card-elevated',
            'focus:outline-none focus:ring-2 focus:ring-kx-primary-400 focus:ring-offset-2',
            'animate-bounce-in'
          )}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {/* Header row: icon + arrow */}
          <div className="flex items-start justify-between mb-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-kx-primary-100 text-kx-primary-700">
              <Scale className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-ledger-gray-300 group-hover:text-kx-primary-500 transition-colors" />
          </div>

          {/* Case title */}
          <p className="text-sm font-semibold text-kx-primary-900 group-hover:text-kx-primary-700 transition-colors truncate">
            {caseItem.caseTitle || 'Untitled Case'}
          </p>

          {/* Case number */}
          {caseItem.caseNumber && (
            <p className="text-xs text-ledger-gray-500 truncate mt-0.5">
              {caseItem.caseNumber}
            </p>
          )}

          {/* Footer: status badge + updated time */}
          <div className="flex items-center gap-2 mt-3">
            <span className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
              statusColors[caseItem.caseStatus] || statusColors.ACTIVE
            )}>
              {formatStatus(caseItem.caseStatus)}
            </span>
            <span className="text-[10px] text-ledger-gray-400">
              {formatDistanceToNow(new Date(caseItem.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

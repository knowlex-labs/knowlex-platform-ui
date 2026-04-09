import { Case } from '@/types/case.types'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Clock } from 'lucide-react'

interface ActiveCaseCardsProps {
  cases: Case[]
  isLoading: boolean
  onCaseClick: (caseId: string) => void
}

const STATUS_CONFIG: Record<Case['status'], { label: string; badge: string; leftBorder: string }> = {
  active: {
    label: 'Active',
    badge: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    leftBorder: 'border-l-green-500',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    leftBorder: 'border-l-yellow-500',
  },
  'on-hold': {
    label: 'On Hold',
    badge: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    leftBorder: 'border-l-orange-500',
  },
  closed: {
    label: 'Closed',
    badge: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
    leftBorder: 'border-l-gray-500',
  },
  appealed: {
    label: 'Appealed',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    leftBorder: 'border-l-blue-500',
  },
  blocked: {
    label: 'Blocked',
    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    leftBorder: 'border-l-red-500',
  },
  archived: {
    label: 'Archived',
    badge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
    leftBorder: 'border-l-slate-500',
  },
}

const DEFAULT_STATUS_CONFIG = STATUS_CONFIG.closed

export function ActiveCaseCards({ cases, isLoading, onCaseClick }: ActiveCaseCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-ledger-gray-200 rounded-lg p-4 animate-pulse"
          >
            <div className="h-5 bg-ledger-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-ledger-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-3 bg-ledger-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-ledger-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-ledger-gray-300 rounded-lg">
        <FileText className="h-12 w-12 text-ledger-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-ledger-gray-900 mb-1">
          No active cases
        </h3>
        <p className="text-sm text-ledger-gray-500">
          Start a new case to see it here
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cases.map((caseItem, index) => (
        <button
          key={caseItem.id}
          onClick={() => onCaseClick(caseItem.id)}
          className={`group bg-kx-card border border-kx-card-border border-l-[3px] ${(STATUS_CONFIG[caseItem.status] ?? DEFAULT_STATUS_CONFIG).leftBorder} rounded-lg p-4 text-left shadow-sm card-elevated focus:outline-none focus:ring-2 focus:ring-kx-primary-400 focus:ring-offset-2 animate-bounce-in`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-ledger-gray-900 group-hover:text-kx-primary-700 transition-colors line-clamp-1">
              {caseItem.caseTitle || 'Untitled Case'}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ml-2 flex-shrink-0 ${(STATUS_CONFIG[caseItem.status] ?? DEFAULT_STATUS_CONFIG).badge}`}
            >
              {(STATUS_CONFIG[caseItem.status] ?? DEFAULT_STATUS_CONFIG).label}
            </span>
          </div>

          {caseItem.caseNumber && (
            <p className="text-sm text-ledger-gray-600 mb-3">
              {caseItem.caseNumber}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-ledger-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Updated {formatDistanceToNow(caseItem.updatedAt, { addSuffix: true })}
            </span>
          </div>

          {caseItem.nextHearingDate && (
            <div className="mt-3 pt-3 border-t border-ledger-gray-100">
              <p className="text-xs text-ledger-gray-600">
                Next hearing:{' '}
                <span className="font-medium text-ledger-gray-900">
                  {caseItem.nextHearingDate ? new Date(caseItem.nextHearingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }) : '—'}
                </span>
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

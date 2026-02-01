import * as React from 'react'
import { Case } from '@/types/case.types'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Clock } from 'lucide-react'

interface ActiveCaseCardsProps {
  cases: Case[]
  isLoading: boolean
  onCaseClick: (caseId: string) => void
}

function getCaseStatusBadgeColor(status: Case['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'on-hold':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'appealed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function formatCaseStatus(status: Case['status']): string {
  switch (status) {
    case 'on-hold':
      return 'On Hold'
    case 'active':
      return 'Active'
    case 'pending':
      return 'Pending'
    case 'closed':
      return 'Closed'
    case 'appealed':
      return 'Appealed'
    case 'blocked':
      return 'Blocked'
    default:
      return status
  }
}

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
      {cases.map((caseItem) => (
        <button
          key={caseItem.id}
          onClick={() => onCaseClick(caseItem.id)}
          className="group border border-ledger-gray-200 rounded-lg p-4 text-left transition-all hover:border-ledger-gray-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ledger-gray-400 focus:ring-offset-2"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-ledger-gray-900 group-hover:text-ledger-black transition-colors line-clamp-1">
              {caseItem.caseTitle || 'Untitled Case'}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ml-2 flex-shrink-0 ${getCaseStatusBadgeColor(
                caseItem.status
              )}`}
            >
              {formatCaseStatus(caseItem.status)}
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
                  {new Date(caseItem.nextHearingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

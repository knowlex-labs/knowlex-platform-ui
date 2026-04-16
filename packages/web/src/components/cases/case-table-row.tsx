import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CaseStatus } from '@knowlex/core/types'
import type { CaseWithClient } from '@/hooks/use-cases-with-clients'

interface CaseTableRowProps {
  caseItem: CaseWithClient
  onClick: () => void
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm',
        STATUS_COLORS[status]
      )}
    >
      {label}
    </span>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function CaseTableRow({ caseItem, onClick }: CaseTableRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full grid grid-cols-12 gap-4 px-4 py-4 text-left bg-kx-card',
        'border-b border-kx-card-border last:border-b-0',
        'hover:bg-kx-primary-50 dark:hover:bg-kx-primary-50 transition-all duration-150',
        'border-l-2 border-l-transparent hover:border-l-kx-primary-500',
        'focus:outline-none'
      )}
    >
      {/* Case Title & Number */}
      <div className="col-span-4">
        <p className="text-sm font-medium text-kx-text-primary truncate">
          {caseItem.caseTitle || 'Untitled Case'}
        </p>
        <code className="text-xs font-mono text-ledger-gray-500 mt-0.5 block">
          {caseItem.caseNumber || '-'}
        </code>
      </div>

      {/* Client Name */}
      <div className="col-span-2">
        <p className="text-sm text-ledger-gray-600 truncate">
          {caseItem.clientName || '-'}
        </p>
      </div>

      {/* Status */}
      <div className="col-span-2">
        <StatusBadge status={caseItem.status} />
      </div>

      {/* Court */}
      <div className="col-span-2">
        <p className="text-sm text-ledger-gray-600 truncate">
          {caseItem.courtName || '-'}
        </p>
      </div>

      {/* Next Hearing */}
      <div className="col-span-2">
        {caseItem.nextHearingDate ? (
          <p className="text-sm text-ledger-gray-600">
            {formatDate(caseItem.nextHearingDate)}
          </p>
        ) : (
          <span className="text-sm text-ledger-gray-400">-</span>
        )}
      </div>
    </button>
  )
}

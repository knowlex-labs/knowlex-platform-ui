import { Calendar, User } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CaseStatus } from '@knowlex/core/types'
import type { CaseWithClient } from '@/hooks/use-cases-with-clients'

interface CaseCardProps {
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

export function CaseCard({ caseItem, onClick }: CaseCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left',
        'border-b border-ledger-gray-100 last:border-b-0',
        'hover:bg-ledger-gray-50 active:bg-ledger-gray-100 transition-colors',
        'focus:outline-none focus:bg-ledger-gray-100',
        'min-h-[72px]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-kx-primary-900 truncate">
            {caseItem.caseTitle || 'Untitled Case'}
          </p>
          {caseItem.caseNumber && (
            <code className="text-xs font-mono text-ledger-gray-500 mt-0.5 block">
              {caseItem.caseNumber}
            </code>
          )}
          {caseItem.clientName && (
            <div className="flex items-center gap-1 text-xs text-ledger-gray-400 mt-1">
              <User className="h-3 w-3" />
              <span className="truncate">{caseItem.clientName}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StatusBadge status={caseItem.status} />
          {caseItem.nextHearingDate && (
            <div className="flex items-center gap-1 text-xs text-ledger-gray-400 mt-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(caseItem.nextHearingDate)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

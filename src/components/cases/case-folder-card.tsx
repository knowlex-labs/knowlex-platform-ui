import { FolderOpen, User, Calendar } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CaseStatus } from '@/types'
import type { CaseWithClient } from '@/hooks/use-cases-with-clients'

interface CaseFolderCardProps {
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

export function CaseFolderCard({ caseItem, onClick }: CaseFolderCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left rounded-lg border border-ledger-gray-200',
        'bg-ledger-white',
        'hover:border-ledger-gray-300 hover:shadow-md',
        'active:bg-ledger-gray-50 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ledger-gray-400 focus:ring-offset-2',
        'flex flex-col gap-3'
      )}
    >
      {/* Header with folder icon and status */}
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg bg-ledger-gray-100 flex items-center justify-center">
          <FolderOpen className="h-5 w-5 text-ledger-gray-600" />
        </div>
        <StatusBadge status={caseItem.status} />
      </div>

      {/* Title and case number */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-ledger-black line-clamp-2">
          {caseItem.caseTitle || 'Untitled Case'}
        </h3>
        {caseItem.caseNumber && (
          <code className="text-xs font-mono text-ledger-gray-500 mt-1 block">
            {caseItem.caseNumber}
          </code>
        )}
      </div>

      {/* Client and date info */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-ledger-gray-100">
        {caseItem.clientName && (
          <div className="flex items-center gap-1.5 text-xs text-ledger-gray-500">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caseItem.clientName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-ledger-gray-400">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{formatDate(caseItem.createdAt)}</span>
        </div>
      </div>
    </button>
  )
}

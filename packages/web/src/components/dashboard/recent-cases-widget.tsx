import { Briefcase } from 'lucide-react'
import { DashboardCard } from './dashboard-card'
import { useNavigate } from 'react-router-dom'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Case, CaseStatus } from '@knowlex/core/types'

interface RecentCasesWidgetProps {
  cases: Case[]
  isLoading: boolean
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

export function RecentCasesWidget({ cases, isLoading }: RecentCasesWidgetProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <DashboardCard
        title="Recent Cases"
        icon={Briefcase}
        action={{ label: 'See All', onClick: () => navigate('/cases') }}
      >
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-ledger-gray-100 rounded w-3/4 mb-1" />
              <div className="h-3 bg-ledger-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Recent Cases"
      icon={Briefcase}
      action={{ label: 'See All', onClick: () => navigate('/cases') }}
    >
      {cases.length === 0 ? (
        <p className="text-sm text-ledger-gray-500 text-center py-4">
          No cases yet
        </p>
      ) : (
        <div className="space-y-3">
          {cases.slice(0, 5).map((caseItem) => (
            <div
              key={caseItem.id}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-kx-primary-900 truncate">
                  {caseItem.caseTitle || 'Untitled Case'}
                </p>
                <p className="text-xs text-ledger-gray-500 truncate">
                  {caseItem.caseNumber || 'No case number'}
                </p>
              </div>
              <StatusBadge status={caseItem.status} />
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}

import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CauseListItem } from '@/types'

interface CauseListCardProps {
  item: CauseListItem
}

export function CauseListCard({ item }: CauseListCardProps) {
  const [expanded, setExpanded] = React.useState(false)

  const petAdvocates = item.metadata.advocates_petitioner
    ? item.metadata.advocates_petitioner.split('\n').filter(Boolean)
    : []
  const resAdvocates = item.metadata.advocates_respondent
    ? item.metadata.advocates_respondent.split('\n').filter(Boolean)
    : []

  return (
    <div
      className="bg-kx-card border border-kx-card-border rounded-lg p-3 mb-2 active:bg-kx-primary-50/50 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top row: S.No + Case Number */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded bg-kx-primary-50 dark:bg-kx-primary-100 text-xs font-bold text-kx-primary-700">
          {item.serialNumber}
        </span>
        <span className="text-sm font-semibold text-kx-text-primary">{item.caseNumber}</span>
        <div className="ml-auto">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-ledger-gray-400" />
            : <ChevronRight className="h-4 w-4 text-ledger-gray-400" />
          }
        </div>
      </div>

      {/* Middle: Petitioner vs. Respondent */}
      <div className="mb-2">
        <p className="text-sm font-medium text-kx-text-primary line-clamp-1">{item.metadata.petitioner}</p>
        <p className="text-xs text-ledger-gray-400 font-medium my-0.5">Vs.</p>
        <p className="text-sm text-kx-text-secondary line-clamp-1">{item.metadata.respondent}</p>
      </div>

      {/* Bottom row: Court Hall No. + C.L. No. */}
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ledger-gray-50 dark:bg-ledger-gray-100 text-ledger-gray-600 font-medium">
          Court {item.courtHallNo ?? item.metadata.court_hall_no ?? '—'}
        </span>
        <span className="text-ledger-gray-500">
          C.L. No. {item.metadata.cl_number}
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-kx-card-border space-y-3">
          {/* Petitioner Advocates */}
          <div>
            <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1">
              Advocates (Petitioner)
            </p>
            <div className="flex flex-col gap-0.5">
              {petAdvocates.length > 0
                ? petAdvocates.map((adv, i) => (
                    <span key={i} className="text-sm text-kx-text-secondary">{adv}</span>
                  ))
                : <span className="text-sm text-ledger-gray-400">None listed</span>
              }
            </div>
          </div>

          {/* Respondent Advocates */}
          <div>
            <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1">
              Advocates (Respondent)
            </p>
            <div className="flex flex-col gap-0.5">
              {resAdvocates.length > 0
                ? resAdvocates.map((adv, i) => (
                    <span key={i} className="text-sm text-kx-text-secondary">{adv}</span>
                  ))
                : <span className="text-sm text-ledger-gray-400">None listed</span>
              }
            </div>
          </div>

          {/* Remarks */}
          {item.metadata.remarks && (
            <div>
              <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1">Remarks</p>
              <p className="text-sm text-kx-text-secondary">{item.metadata.remarks}</p>
            </div>
          )}

          {/* Lawyer + Bench */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1">Lawyer</p>
              <p className="text-sm text-kx-text-secondary">{item.lawyerName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1">Bench</p>
              <p className="text-sm text-kx-text-secondary">{item.bench}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CauseListCardListProps {
  items: CauseListItem[]
}

export function CauseListCardList({ items }: CauseListCardListProps) {
  return (
    <div className="px-3 py-2">
      {items.map((item) => (
        <CauseListCard key={item.id} item={item} />
      ))}
    </div>
  )
}

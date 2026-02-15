import { CaseFolderCard } from './case-folder-card'
import type { CaseWithClient } from '@/hooks/use-cases-with-clients'

interface CaseFolderGridProps {
  cases: CaseWithClient[]
  onCaseClick: (caseItem: CaseWithClient) => void
  onRefresh: () => void
}

export function CaseFolderGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="animate-pulse p-4 rounded-lg border border-ledger-gray-200 bg-ledger-white"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 bg-ledger-gray-100 rounded-lg" />
            <div className="h-5 w-16 bg-ledger-gray-100 rounded" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-ledger-gray-100 rounded w-3/4" />
            <div className="h-3 bg-ledger-gray-100 rounded w-1/2" />
          </div>
          <div className="pt-2 border-t border-ledger-gray-100 space-y-1.5">
            <div className="h-3 bg-ledger-gray-100 rounded w-2/3" />
            <div className="h-3 bg-ledger-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CaseFolderGrid({ cases, onCaseClick, onRefresh }: CaseFolderGridProps) {
  if (cases.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-ledger-gray-500">No cases found</p>
        <p className="text-xs text-ledger-gray-400 mt-1">
          Cases are created when you add clients
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cases.map((caseItem) => (
        <CaseFolderCard
          key={caseItem.id}
          caseItem={caseItem}
          onClick={() => onCaseClick(caseItem)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}

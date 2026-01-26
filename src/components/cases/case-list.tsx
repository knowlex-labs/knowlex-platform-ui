import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/navigation-context'
import { useCasesWithClients, type CaseWithClient } from '@/hooks/use-cases-with-clients'
import { CaseCard } from './case-card'
import { CaseTableRow } from './case-table-row'
import { cn } from '@/lib/utils'

type SortField = 'caseTitle' | 'clientName' | 'status' | 'courtName' | 'nextHearingDate'
type SortOrder = 'asc' | 'desc'

function CaseListSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="animate-pulse px-4 py-4 border-b border-ledger-gray-100"
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <div className="h-4 bg-ledger-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-ledger-gray-100 rounded w-1/2" />
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-ledger-gray-100 rounded w-2/3" />
            </div>
            <div className="col-span-2">
              <div className="h-5 bg-ledger-gray-100 rounded w-16" />
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-ledger-gray-100 rounded w-3/4" />
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-ledger-gray-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface SortableHeaderProps {
  label: string
  field: SortField
  currentSort: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  className?: string
}

function SortableHeader({
  label,
  field,
  currentSort,
  sortOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === field
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors',
        isActive ? 'text-ledger-black' : 'text-ledger-gray-500 hover:text-ledger-gray-700',
        className
      )}
    >
      {label}
      <ArrowUpDown
        className={cn(
          'h-3 w-3',
          isActive && sortOrder === 'desc' && 'rotate-180'
        )}
      />
    </button>
  )
}

export function CaseList() {
  const { setSelectedCaseId } = useNavigation()
  const {
    cases,
    isLoading,
    error,
    totalPages,
    currentPage,
    setPage,
    refresh,
  } = useCasesWithClients({ pageSize: 20 })

  const [sortField, setSortField] = useState<SortField>('caseTitle')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedCases = [...cases].sort((a, b) => {
    let aVal: string | number | null = null
    let bVal: string | number | null = null

    switch (sortField) {
      case 'caseTitle':
        aVal = a.caseTitle?.toLowerCase() ?? ''
        bVal = b.caseTitle?.toLowerCase() ?? ''
        break
      case 'clientName':
        aVal = a.clientName?.toLowerCase() ?? ''
        bVal = b.clientName?.toLowerCase() ?? ''
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'courtName':
        aVal = a.courtName?.toLowerCase() ?? ''
        bVal = b.courtName?.toLowerCase() ?? ''
        break
      case 'nextHearingDate':
        aVal = a.nextHearingDate?.getTime() ?? 0
        bVal = b.nextHearingDate?.getTime() ?? 0
        break
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleCaseClick = (caseItem: CaseWithClient) => {
    setSelectedCaseId(caseItem.id)
  }

  if (error) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
              Cases
            </h2>
            <p className="text-sm text-ledger-gray-500 mt-1">
              Manage your case files and proceedings
            </p>
          </div>
        </div>
        <div className="bg-ledger-white p-8 text-center">
          <p className="text-sm text-ledger-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={refresh}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
            Cases
          </h2>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Manage your case files and proceedings
          </p>
        </div>
      </div>

      <div className="bg-ledger-white">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-y border-ledger-gray-200 bg-ledger-gray-50">
          <SortableHeader
            label="Case"
            field="caseTitle"
            currentSort={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            className="col-span-4"
          />
          <SortableHeader
            label="Client"
            field="clientName"
            currentSort={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            className="col-span-2"
          />
          <SortableHeader
            label="Status"
            field="status"
            currentSort={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            className="col-span-2"
          />
          <SortableHeader
            label="Court"
            field="courtName"
            currentSort={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            className="col-span-2"
          />
          <SortableHeader
            label="Next Hearing"
            field="nextHearingDate"
            currentSort={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            className="col-span-2"
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <CaseListSkeleton />
        ) : sortedCases.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-ledger-gray-500">No cases found</p>
            <p className="text-xs text-ledger-gray-400 mt-1">
              Cases are created when you add clients
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-280px)]">
            {/* Mobile Card View */}
            <div className="md:hidden">
              {sortedCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onClick={() => handleCaseClick(caseItem)}
                />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              {sortedCases.map((caseItem) => (
                <CaseTableRow
                  key={caseItem.id}
                  caseItem={caseItem}
                  onClick={() => handleCaseClick(caseItem)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-y border-ledger-gray-200 bg-ledger-gray-50">
            <p className="text-xs text-ledger-gray-500">
              Page {currentPage + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="h-10 w-10 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, List } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { useCasesWithClients, type CaseWithClient } from '@/hooks/use-cases-with-clients'
import { useCaseFilters } from '@/hooks/use-case-filters'
import { useCaseTypes } from '@/hooks/use-case-types'
import { CaseFolderGrid, CaseFolderGridSkeleton } from './case-folder-grid'
import { CaseTableRow } from './case-table-row'
import { CaseFilters } from './case-filters'
import { AddCaseModal } from './add-case-modal'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

export function CaseList() {
  const navigate = useNavigate()
  const { setSidebarCollapsed, showAddCaseModal: showAddCaseModalFromNav, setShowAddCaseModal: setShowAddCaseModalFromNav } = useUIState()
  const [searchQuery, setSearchQuery] = useState('')
  const {
    cases,
    clients,
    isLoading,
    error,
    totalElements,
    totalPages,
    currentPage,
    setPage,
    refresh,
  } = useCasesWithClients({ pageSize: 20, q: searchQuery })

  const {
    filters,
    setDateRange,
    setClientFilter,
    setCaseTypeFilter,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
    filterCases,
  } = useCaseFilters()

  const { caseTypes } = useCaseTypes()
  const [showAddCaseModal, setShowAddCaseModal] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('knowlex_cases_view') as ViewMode) || 'grid'
  })

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('knowlex_cases_view', mode)
  }

  // Consume showAddCaseModal flag from navigation context (set by dashboard)
  useEffect(() => {
    if (showAddCaseModalFromNav) {
      setShowAddCaseModal(true)
      setShowAddCaseModalFromNav(false)
    }
  }, [showAddCaseModalFromNav, setShowAddCaseModalFromNav])

  const filteredCases = filterCases(cases)

  const handleCaseClick = (caseItem: CaseWithClient) => {
    // Auto-collapse sidebar when opening a case
    setSidebarCollapsed(true)
    navigate(`/cases/${caseItem.id}`)
  }

  if (error) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
              Cases
            </h2>
            <p className="text-sm text-ledger-gray-500 mt-1">
              Manage your case files and proceedings
            </p>
          </div>
          <Button onClick={() => setShowAddCaseModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Case
          </Button>
        </div>
        <div className="bg-kx-card p-8 text-center">
          <p className="text-sm text-ledger-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={refresh}>
            Try Again
          </Button>
        </div>
        <AddCaseModal
          open={showAddCaseModal}
          onOpenChange={setShowAddCaseModal}
          onSuccess={refresh}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
            Cases
          </h2>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Manage your case files and proceedings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex h-9 rounded-lg border border-ledger-gray-200 overflow-hidden">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={cn(
                'flex items-center justify-center w-9 h-full transition-colors',
                viewMode === 'grid'
                  ? 'bg-kx-primary-600 text-white'
                  : 'text-ledger-gray-500 hover:bg-ledger-gray-50'
              )}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={cn(
                'flex items-center justify-center w-9 h-full transition-colors',
                viewMode === 'list'
                  ? 'bg-kx-primary-600 text-white'
                  : 'text-ledger-gray-500 hover:bg-ledger-gray-50'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setShowAddCaseModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Case
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <CaseFilters
          filters={filters}
          clients={clients}
          caseTypes={caseTypes}
          onDateRangeChange={setDateRange}
          onClientChange={setClientFilter}
          onCaseTypeChange={setCaseTypeFilter}
          onStatusChange={setStatusFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Case Grid / List */}
      <div className="p-4 rounded-lg border border-kx-card-border">
        {isLoading ? (
          <CaseFolderGridSkeleton />
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            {viewMode === 'grid' ? (
              <CaseFolderGrid cases={filteredCases} onCaseClick={handleCaseClick} onRefresh={refresh} />
            ) : (
              filteredCases.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-ledger-gray-500">No cases found</p>
                </div>
              ) : (
                <div className="border border-kx-card-border rounded-lg overflow-hidden shadow-sm">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-ledger-gray-50 dark:bg-ledger-gray-100 border-b border-kx-card-border text-xs font-medium text-ledger-gray-600 uppercase tracking-wider">
                    <div className="col-span-4">Case</div>
                    <div className="col-span-2">Client</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Court</div>
                    <div className="col-span-2">Next Hearing</div>
                  </div>
                  {filteredCases.map((caseItem) => (
                    <CaseTableRow
                      key={caseItem.id}
                      caseItem={caseItem}
                      onClick={() => handleCaseClick(caseItem)}
                    />
                  ))}
                </div>
              )
            )}
          </ScrollArea>
        )}

        {!isLoading && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-ledger-gray-200">
            <p className="text-xs text-ledger-gray-500">
              {totalElements} total · Page {Math.min(currentPage + 1, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0 || totalPages <= 1}
                className="h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || totalPages <= 1}
                className="h-10 w-10 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddCaseModal
        open={showAddCaseModal}
        onOpenChange={setShowAddCaseModal}
        onSuccess={refresh}
      />
    </div>
  )
}

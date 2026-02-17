import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { useCasesWithClients, type CaseWithClient } from '@/hooks/use-cases-with-clients'
import { useCaseFilters } from '@/hooks/use-case-filters'
import { CaseFolderGrid, CaseFolderGridSkeleton } from './case-folder-grid'
import { CaseFilters } from './case-filters'
import { AddCaseModal } from './add-case-modal'
import { clientApi } from '@/services/api'
import { mapBackendClient } from '@/services/mappers'

interface ClientOption {
  id: string
  name: string
}

export function CaseList() {
  const navigate = useNavigate()
  const { setSidebarCollapsed, showAddCaseModal: showAddCaseModalFromNav, setShowAddCaseModal: setShowAddCaseModalFromNav } = useUIState()
  const {
    cases,
    isLoading,
    error,
    totalPages,
    currentPage,
    setPage,
    refresh,
  } = useCasesWithClients({ pageSize: 20 })

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

  const [clients, setClients] = useState<ClientOption[]>([])
  const [showAddCaseModal, setShowAddCaseModal] = useState(false)

  // Consume showAddCaseModal flag from navigation context (set by dashboard)
  useEffect(() => {
    if (showAddCaseModalFromNav) {
      setShowAddCaseModal(true)
      setShowAddCaseModalFromNav(false)
    }
  }, [showAddCaseModalFromNav, setShowAddCaseModalFromNav])

  // Fetch clients for filter dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientApi.getAll({ page: 0, size: 100 })
        if (response.status === 'success') {
          const mappedClients = response.data.content.map((c) => {
            const client = mapBackendClient(c)
            return { id: client.id, name: client.name }
          })
          setClients(mappedClients)
        }
      } catch {
        // Silently fail - filters will just show empty client list
      }
    }
    fetchClients()
  }, [])

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
        <Button onClick={() => setShowAddCaseModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Case
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <CaseFilters
          filters={filters}
          clients={clients}
          onDateRangeChange={setDateRange}
          onClientChange={setClientFilter}
          onCaseTypeChange={setCaseTypeFilter}
          onStatusChange={setStatusFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Case Grid */}
      <div className="p-4 rounded-lg border border-kx-card-border">
        {isLoading ? (
          <CaseFolderGridSkeleton />
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <CaseFolderGrid cases={filteredCases} onCaseClick={handleCaseClick} onRefresh={refresh} />
          </ScrollArea>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-ledger-gray-200">
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

      <AddCaseModal
        open={showAddCaseModal}
        onOpenChange={setShowAddCaseModal}
        onSuccess={refresh}
      />
    </div>
  )
}

import { Search, X } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CaseFilter, CaseTypeOption } from '@knowlex/core/types'

interface CaseFiltersProps {
  filters: CaseFilter
  clients: { id: string; name: string }[]
  caseTypes: CaseTypeOption[]
  onDateRangeChange: (from: Date | null, to: Date | null) => void
  onClientChange: (clientId: string | null) => void
  onCaseTypeChange: (caseType: string | null) => void
  onStatusChange: (status: string | null) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
}

const CASE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'closed', label: 'Closed' },
]

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
]

function getDateRange(value: string): { from: Date | null; to: Date | null } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (value) {
    case 'today':
      return { from: today, to: now }
    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { from: weekAgo, to: now }
    }
    case 'month': {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return { from: monthAgo, to: now }
    }
    case 'year': {
      const yearAgo = new Date(today)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      return { from: yearAgo, to: now }
    }
    default:
      return { from: null, to: null }
  }
}

function getCurrentDateRangeValue(dateRange: CaseFilter['dateRange']): string {
  if (!dateRange || (!dateRange.from && !dateRange.to)) {
    return 'all'
  }
  return 'custom'
}

export function CaseFilters({
  filters,
  clients,
  caseTypes,
  onDateRangeChange,
  onClientChange,
  onCaseTypeChange,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  searchQuery,
  onSearchChange,
}: CaseFiltersProps) {
  const handleDateChange = (value: string) => {
    const { from, to } = getDateRange(value)
    onDateRangeChange(from, to)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-ledger-gray-50 rounded-lg border border-ledger-gray-200">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-gray-400 pointer-events-none" />
        <Input
          placeholder="Search by case name or number..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9 pr-8 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ledger-gray-400 hover:text-ledger-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Date Filter */}
      <Select
        value={getCurrentDateRangeValue(filters.dateRange)}
        onChange={(e) => handleDateChange(e.target.value)}
        className="w-32 h-9"
      >
        {DATE_RANGES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {/* Client Filter */}
      <Select
        value={filters.clientId ?? ''}
        onChange={(e) => onClientChange(e.target.value || null)}
        className="w-40 h-9"
      >
        <option value="">All Clients</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </Select>

      {/* Case Type Filter */}
      <Select
        value={filters.caseType ?? ''}
        onChange={(e) => onCaseTypeChange(e.target.value || null)}
        className="w-36 h-9"
        searchable
        searchPlaceholder="Search type..."
      >
        <option value="">All Types</option>
        {caseTypes.map((t) => (
          <option key={t.value} value={t.value}>{t.displayName}</option>
        ))}
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status ?? ''}
        onChange={(e) => onStatusChange(e.target.value || null)}
        className="w-32 h-9"
      >
        <option value="">All Status</option>
        {CASE_STATUSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1 text-ledger-gray-600 hover:text-kx-primary-700"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}

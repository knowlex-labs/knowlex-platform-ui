import { Input } from '@/components/ui/input'
import type { CauseListFilters } from '@knowlex/core/types'

interface CauseListFiltersBarProps {
  filters: CauseListFilters
  onFiltersChange: (filters: CauseListFilters) => void
}

export function CauseListFiltersBar({ filters, onFiltersChange }: CauseListFiltersBarProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-ledger-gray-50 rounded-lg border border-ledger-gray-200">
      {/* Date picker */}
      <div className="space-y-0.5">
        <label className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">Date</label>
        <button
          type="button"
          className="relative w-full"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input')
            input?.showPicker()
          }}
        >
          <Input
            type="date"
            value={filters.date ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, date: e.target.value || undefined })}
            className="h-9 text-sm cursor-pointer w-[170px]"
          />
        </button>
      </div>
    </div>
  )
}

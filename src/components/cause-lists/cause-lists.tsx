import { useCauseLists } from '@/hooks/use-cause-lists'
import { CauseListTable } from './cause-list-table'
import { CauseListPagination } from './cause-list-pagination'
import { Input } from '@/components/ui/input'
import { RefreshButton } from '@/components/ui/refresh-button'

export function CauseLists() {
  const {
    items,
    filters,
    setFilters,
    pagination,
    setPage,
    isLoading,
    error,
    refresh,
  } = useCauseLists()

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-16px)]">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
              Cause Lists
            </h2>
            <p className="text-sm text-ledger-gray-500 mt-1">
              View your upcoming court hearings and cause lists
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input')
                input?.showPicker()
              }}
            >
              <Input
                type="date"
                value={filters.date ?? ''}
                onChange={(e) => setFilters({ ...filters, date: e.target.value || undefined })}
                className="h-9 text-sm cursor-pointer w-[160px]"
              />
            </button>
            <RefreshButton onClick={refresh} isLoading={isLoading} />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        <CauseListTable
          items={items}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && items.length > 0 && (
          <div className="pt-2">
            <CauseListPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              size={pagination.size}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}

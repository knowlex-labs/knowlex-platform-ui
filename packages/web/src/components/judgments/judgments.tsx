import { useJudgments } from '@/hooks/use-judgments'
import { JudgmentFiltersBar } from './judgment-filters'
import { JudgmentTable } from './judgment-table'
import { JudgmentPagination } from './judgment-pagination'
import { RefreshButton } from '@/components/ui/refresh-button'

export function Judgments() {
    const {
        judgments,
        filters,
        setFilters,
        pagination,
        setPage,
        setPageSize,
        isLoading,
        error,
        sorts,
        toggleSort,
        refresh,
    } = useJudgments()

    return (
        <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
                            Judgments
                        </h2>
                        <p className="text-sm text-ledger-gray-500 mt-1">
                            Browse Supreme Court Judgments
                        </p>
                    </div>
                    <RefreshButton onClick={refresh} isLoading={isLoading} className="w-full sm:w-auto" />
                </div>

                {/* Error banner */}
                {error && (
                    <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <JudgmentFiltersBar
                    filters={filters}
                    onFiltersChange={setFilters}
                />

                {/* Table + Pagination */}
                <div className="p-4 rounded-lg border border-kx-card-border">
                    <JudgmentTable
                        judgments={judgments}
                        isLoading={isLoading}
                        sorts={sorts}
                        toggleSort={toggleSort}
                    />

                    {!isLoading && judgments.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-ledger-gray-200">
                            <JudgmentPagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                totalElements={pagination.totalElements}
                                size={pagination.size}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                rowsSelectId="judgments-tab-page-size"
                            />
                        </div>
                    )}
                </div>
        </div>
    )
}

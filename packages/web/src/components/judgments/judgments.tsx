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
        <div className="h-full overflow-hidden bg-kx-surface flex">
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {/* Sticky header + filters */}
                <div className="flex-shrink-0 px-6 pt-6 pb-3 space-y-3 bg-kx-surface">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

                    {error && (
                        <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <JudgmentFiltersBar
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </div>

                {/* Scrollable table area */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                    <div className="px-6 pb-4">
                        <div className="border-y border-kx-card-border">
                            <JudgmentTable
                                judgments={judgments}
                                isLoading={isLoading}
                                sorts={sorts}
                                toggleSort={toggleSort}
                            />
                        </div>
                    </div>

                    {!isLoading && judgments.length > 0 && (
                        <div className="px-6 py-4 mt-2 border-t border-kx-card-border">
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
        </div>
    )
}

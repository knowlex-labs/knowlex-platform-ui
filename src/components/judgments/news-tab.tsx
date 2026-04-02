import { Newspaper } from 'lucide-react'
import { useNews } from '@/hooks/use-news'
import { NewsFilterBar } from './news-filter-bar'
import { NewsCard, NewsCardSkeleton } from './news-card'
import { JudgmentPagination } from './judgment-pagination'
import { RefreshButton } from '@/components/ui/refresh-button'

const SKELETON_COUNT = 8

function NewsGrid({ items, isLoading }: { items: ReturnType<typeof useNews>['newsItems'], isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <NewsCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Newspaper className="h-10 w-10 text-ledger-gray-300" />
                <p className="text-sm font-medium text-ledger-gray-500">No news found</p>
                <p className="text-xs text-ledger-gray-400">Try adjusting your filters</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
                <NewsCard key={item.id} item={item} />
            ))}
        </div>
    )
}

export function NewsTab() {
    const { newsItems, filters, setFilters, pagination, setPage, isLoading, error, refresh } = useNews()

    return (
        <div className="px-2 py-4 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
                        Legal News
                    </h2>
                    <p className="text-sm text-ledger-gray-500 mt-1">
                        Latest from LiveLaw and Bar & Bench
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
            <NewsFilterBar filters={filters} onFiltersChange={setFilters} />

            {/* Grid */}
            <div className="p-4 rounded-lg border border-kx-card-border">
                <NewsGrid items={newsItems} isLoading={isLoading} />

                {!isLoading && newsItems.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-ledger-gray-200">
                        <JudgmentPagination
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

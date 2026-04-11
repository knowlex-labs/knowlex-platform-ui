import { Newspaper } from 'lucide-react'
import { useNews } from '@/hooks/use-news'
import { NewsFilterBar } from './news-filter-bar'
import {
    FeaturedNewsCard,
    SidebarNewsCard,
    GridNewsCard,
    FeaturedNewsCardSkeleton,
    SidebarNewsCardSkeleton,
    GridNewsCardSkeleton,
} from './news-card'
import { JudgmentPagination } from './judgment-pagination'
import { RefreshButton } from '@/components/ui/refresh-button'
import type { NewsItem } from '@/types'

// ─── Feed layout ──────────────────────────────────────────────────────────────
//
// Top section:  [ Featured (60%) ] [ 2 stacked sidebar cards (40%) ]
// Rest:         3-column grid

function NewsFeed({ items }: { items: NewsItem[] }) {
    const featured = items[0]
    const sidebar = items.slice(1, 3)
    const grid = items.slice(3)

    return (
        <div className="space-y-6">
            {/* Top section */}
            {featured && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                    {/* Featured */}
                    <FeaturedNewsCard item={featured} />

                    {/* Sidebar: 2 stacked cards */}
                    {sidebar.length > 0 && (
                        <div className="rounded-2xl border border-ledger-gray-200 overflow-hidden flex flex-col">
                            {sidebar.map((item, i) => (
                                <SidebarNewsCard key={item.id} item={item} hasBorder={i > 0} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Grid */}
            {grid.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
                    {grid.map((item) => (
                        <GridNewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NewsFeedSkeleton() {
    return (
        <div className="space-y-6">
            {/* Top section skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                <FeaturedNewsCardSkeleton />
                <div className="rounded-2xl border border-ledger-gray-200 overflow-hidden flex flex-col">
                    <SidebarNewsCardSkeleton />
                    <SidebarNewsCardSkeleton hasBorder />
                </div>
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
                {Array.from({ length: 6 }).map((_, i) => (
                    <GridNewsCardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function NewsEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Newspaper className="h-10 w-10 text-ledger-gray-300" />
            <p className="text-sm font-medium text-ledger-gray-500">No news found</p>
            <p className="text-xs text-ledger-gray-400">Try adjusting your filters or check back later</p>
        </div>
    )
}

// ─── Main tab ──────────────────────────────────────────────────────────────────

export function NewsTab() {
    const { newsItems, filters, setFilters, pagination, setPage, setPageSize, isLoading, error, refresh } = useNews()

    return (
        <div className="px-2 py-4 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
                        Legal News
                    </h2>
                    <p className="text-sm text-ledger-gray-500 mt-0.5">
                        Latest from LiveLaw and Bar & Bench
                    </p>
                </div>
                <RefreshButton onClick={refresh} isLoading={isLoading} className="w-full sm:w-auto" />
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Filters */}
            <NewsFilterBar filters={filters} onFiltersChange={setFilters} />

            <div className="border-t border-ledger-gray-200" />

            {/* Content */}
            {isLoading ? (
                <NewsFeedSkeleton />
            ) : newsItems.length === 0 ? (
                <NewsEmptyState />
            ) : (
                <>
                    <NewsFeed items={newsItems} />

                    <div className="border-t border-ledger-gray-200 pt-4">
                        <JudgmentPagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            totalElements={pagination.totalElements}
                            size={pagination.size}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            rowsSelectId="news-tab-page-size"
                            label="news"
                        />
                    </div>
                </>
            )}
        </div>
    )
}

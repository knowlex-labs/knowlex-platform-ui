import { useState } from 'react'
import { ExternalLink, Newspaper } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { NewsItem } from '@/types'

const SOURCE_STYLES: Record<string, string> = {
    LiveLaw: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    BarAndBench: 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
}

const CATEGORY_STYLES: Record<string, string> = {
    'supreme-court': 'bg-kx-primary-50 text-kx-primary-700 border border-kx-primary-200',
    'high-court': 'bg-green-50 text-green-700 border border-green-200',
    'top-stories': 'bg-orange-50 text-orange-700 border border-orange-200',
    'trending': 'bg-red-50 text-red-700 border border-red-200',
}

const CATEGORY_LABELS: Record<string, string> = {
    'supreme-court': 'Supreme Court',
    'high-court': 'High Court',
    'top-stories': 'Top Stories',
    'trending': 'Trending',
    'all': 'All',
}

function relativeTime(dateStr: string): string {
    try {
        return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
    } catch {
        return dateStr
    }
}

interface NewsCardProps {
    item: NewsItem
}

export function NewsCard({ item }: NewsCardProps) {
    const [imgError, setImgError] = useState(false)

    const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-lg border border-kx-card-border bg-kx-card hover:border-kx-primary-300 hover:shadow-sm transition-all duration-150 overflow-hidden"
        >
            {/* Image */}
            {item.imageUrl && !imgError ? (
                <img
                    src={item.imageUrl}
                    alt={item.title}
                    onError={() => setImgError(true)}
                    className="w-full aspect-video object-cover"
                />
            ) : (
                <div className="w-full aspect-video bg-ledger-gray-100 flex items-center justify-center">
                    <Newspaper className="h-8 w-8 text-ledger-gray-300" />
                </div>
            )}

            {/* Body */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        SOURCE_STYLES[item.source] ?? 'bg-ledger-gray-100 text-ledger-gray-700 border border-ledger-gray-200'
                    )}>
                        {item.source}
                    </span>
                    {item.category && item.category !== 'all' && (
                        <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            CATEGORY_STYLES[item.category] ?? 'bg-ledger-gray-100 text-ledger-gray-600 border border-ledger-gray-200'
                        )}>
                            {categoryLabel}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-kx-text-primary leading-snug line-clamp-2 group-hover:text-kx-primary-700 transition-colors">
                    {item.title}
                    <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity align-middle" />
                </h3>

                {/* Description */}
                {item.description && (
                    <p className="text-xs text-ledger-gray-500 line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>
                )}

                {/* Timestamp */}
                <p className="text-xs text-ledger-gray-400 mt-auto pt-1">
                    {relativeTime(item.publishedAt)}
                </p>
            </div>
        </a>
    )
}

export function NewsCardSkeleton() {
    return (
        <div className="rounded-lg border border-kx-card-border overflow-hidden animate-pulse">
            <div className="w-full aspect-video bg-ledger-gray-200" />
            <div className="p-4 space-y-2.5">
                <div className="flex gap-1.5">
                    <div className="h-5 w-14 bg-ledger-gray-200 rounded" />
                    <div className="h-5 w-20 bg-ledger-gray-200 rounded" />
                </div>
                <div className="space-y-1.5">
                    <div className="h-4 bg-ledger-gray-200 rounded w-full" />
                    <div className="h-4 bg-ledger-gray-200 rounded w-3/4" />
                </div>
                <div className="h-3 bg-ledger-gray-200 rounded w-full" />
                <div className="h-3 bg-ledger-gray-200 rounded w-2/3" />
                <div className="h-3 bg-ledger-gray-100 rounded w-1/3 mt-1" />
            </div>
        </div>
    )
}

import { useState } from 'react'
import { Newspaper } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { NewsItem } from '@knowlex/core/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
    LiveLaw: 'text-blue-600',
    BarAndBench: 'text-purple-600',
}

const SOURCE_BG: Record<string, string> = {
    LiveLaw: 'bg-blue-600',
    BarAndBench: 'bg-purple-600',
}

const CATEGORY_LABELS: Record<string, string> = {
    'supreme-court': 'Supreme Court',
    'high-court': 'High Court',
    'top-stories': 'Top Stories',
    'trending': 'Trending',
}

export function relativeTime(dateStr: string): string {
    try {
        return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
    } catch {
        return ''
    }
}

function Img({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
    const [error, setError] = useState(false)
    if (src && !error) {
        return <img src={src} alt={alt} onError={() => setError(true)} className={cn('w-full h-full object-cover', className)} />
    }
    return (
        <div className={cn('w-full h-full flex items-center justify-center bg-ledger-gray-100', className)}>
            <Newspaper className="h-7 w-7 text-ledger-gray-300" />
        </div>
    )
}

// ─── Featured card ─────────────────────────────────────────────────────────────
// Large card: full image background, gradient overlay, text at bottom

export function FeaturedNewsCard({ item }: { item: NewsItem }) {
    const categoryLabel = CATEGORY_LABELS[item.category]

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block rounded-2xl overflow-hidden h-52 md:h-56 bg-ledger-gray-100"
        >
            {/* Image */}
            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <Img src={item.imageUrl} alt={item.title} />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* Source badge — top left */}
            <div className="absolute top-4 left-4">
                <span className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white',
                    SOURCE_BG[item.source] ?? 'bg-ledger-gray-600'
                )}>
                    {item.source}
                </span>
            </div>

            {/* Text — bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                {categoryLabel && (
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
                        {categoryLabel}
                    </p>
                )}
                <h2 className="text-white font-serif text-xl md:text-2xl font-semibold leading-snug line-clamp-3 group-hover:text-white/90 transition-colors">
                    {item.title}
                </h2>
                <p className="text-white/50 text-xs mt-2">{relativeTime(item.publishedAt)}</p>
            </div>
        </a>
    )
}

// ─── Sidebar compact card ──────────────────────────────────────────────────────
// Horizontal row: small thumbnail + text — used in the right-column sidebar

export function SidebarNewsCard({ item, hasBorder }: { item: NewsItem; hasBorder?: boolean }) {
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'group flex gap-3 p-3.5 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-900/50 transition-colors',
                hasBorder && 'border-t border-ledger-gray-100'
            )}
        >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-[72px] h-[52px] rounded-lg overflow-hidden bg-ledger-gray-100">
                <Img src={item.imageUrl} alt={item.title} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-sm font-medium text-kx-text-primary leading-snug line-clamp-2 group-hover:text-kx-primary-700 transition-colors">
                    {item.title}
                </h3>
                <p className="text-xs text-ledger-gray-400">
                    <span className={cn('font-medium', SOURCE_COLORS[item.source] ?? 'text-ledger-gray-500')}>
                        {item.source}
                    </span>
                    {' · '}
                    {relativeTime(item.publishedAt)}
                </p>
            </div>
        </a>
    )
}

// ─── Grid card ─────────────────────────────────────────────────────────────────
// Vertical card: image top, text below — for the 3-col grid

export function GridNewsCard({ item }: { item: NewsItem }) {
    const categoryLabel = CATEGORY_LABELS[item.category]

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col"
        >
            {/* Image */}
            <div className="h-36 rounded-xl overflow-hidden bg-ledger-gray-100">
                <div className="w-full h-full transition-transform duration-300 group-hover:scale-[1.04]">
                    <Img src={item.imageUrl} alt={item.title} />
                </div>
            </div>

            {/* Text */}
            <div className="pt-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold', SOURCE_COLORS[item.source] ?? 'text-ledger-gray-500')}>
                        {item.source}
                    </span>
                    {categoryLabel && (
                        <>
                            <span className="text-ledger-gray-300 text-xs">·</span>
                            <span className="text-xs text-ledger-gray-400">{categoryLabel}</span>
                        </>
                    )}
                </div>
                <h3 className="text-sm font-semibold text-kx-text-primary leading-snug line-clamp-2 group-hover:text-kx-primary-700 transition-colors">
                    {item.title}
                </h3>
                <p className="text-xs text-ledger-gray-400">{relativeTime(item.publishedAt)}</p>
            </div>
        </a>
    )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

export function FeaturedNewsCardSkeleton() {
    return (
        <div className="rounded-2xl h-52 md:h-56 bg-ledger-gray-200 animate-pulse" />
    )
}

export function SidebarNewsCardSkeleton({ hasBorder }: { hasBorder?: boolean }) {
    return (
        <div className={cn('flex gap-3 p-3.5 animate-pulse', hasBorder && 'border-t border-ledger-gray-100')}>
            <div className="flex-shrink-0 w-[72px] h-[52px] rounded-lg bg-ledger-gray-200" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-ledger-gray-200 rounded w-full" />
                <div className="h-3.5 bg-ledger-gray-200 rounded w-3/4" />
                <div className="h-3 bg-ledger-gray-100 rounded w-1/2" />
            </div>
        </div>
    )
}

export function GridNewsCardSkeleton() {
    return (
        <div className="flex flex-col animate-pulse">
            <div className="h-36 rounded-xl bg-ledger-gray-200" />
            <div className="pt-3 space-y-2">
                <div className="flex gap-2">
                    <div className="h-3 w-12 bg-ledger-gray-200 rounded-full" />
                    <div className="h-3 w-16 bg-ledger-gray-100 rounded-full" />
                </div>
                <div className="h-4 bg-ledger-gray-200 rounded w-full" />
                <div className="h-4 bg-ledger-gray-200 rounded w-4/5" />
                <div className="h-3 bg-ledger-gray-100 rounded w-1/3" />
            </div>
        </div>
    )
}

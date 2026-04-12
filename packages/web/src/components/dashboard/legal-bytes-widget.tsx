import { useState, useEffect } from 'react'
import { ArrowRight, Newspaper } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { newsApi } from '@knowlex/core/api/news-api'
import { relativeTime } from '@/components/judgments/news-card'
import type { NewsItem } from '@knowlex/core/types'

const SOURCE_COLORS: Record<string, string> = {
    LiveLaw: 'text-blue-600',
    BarAndBench: 'text-purple-600',
}

export function LegalBytesWidget() {
    const [items, setItems] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        newsApi.list({ page: 0, size: 5 })
            .then((res) => setItems(res.data.content))
            .catch(() => {})
            .finally(() => setIsLoading(false))
    }, [])

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <Newspaper className="h-4 w-4 text-kx-primary-600" />
                    <h2 className="text-sm font-semibold text-kx-primary-900">Legal Bytes</h2>
                </div>
                <button
                    onClick={() => navigate('/judgments?tab=news')}
                    className="flex items-center gap-1 text-xs text-kx-primary-600 hover:text-kx-primary-800 font-medium transition-colors"
                >
                    All news
                    <ArrowRight className="h-3 w-3" />
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse py-3 space-y-2 border-b border-ledger-gray-100 last:border-0">
                            <div className="h-3.5 bg-ledger-gray-200 rounded w-full" />
                            <div className="h-3.5 bg-ledger-gray-200 rounded w-4/5" />
                            <div className="h-3 bg-ledger-gray-100 rounded w-full" />
                            <div className="h-2.5 bg-ledger-gray-100 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <p className="text-xs text-ledger-gray-400 text-center py-6">No news available</p>
            ) : (
                <div>
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block py-3.5 border-b border-ledger-gray-100 last:border-0"
                        >
                            {/* Title */}
                            <p className="text-sm font-medium text-kx-text-primary leading-snug line-clamp-2 group-hover:text-kx-primary-700 transition-colors">
                                {item.title}
                            </p>
                            {/* Description */}
                            {item.description && (
                                <p className="text-xs text-ledger-gray-500 leading-relaxed line-clamp-2 mt-1">
                                    {item.description}
                                </p>
                            )}
                            {/* Source + time */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className={cn(
                                    'h-1.5 w-1.5 rounded-full flex-shrink-0',
                                    item.source === 'LiveLaw' ? 'bg-blue-500' : 'bg-purple-500'
                                )} />
                                <span className={cn('text-[11px] font-medium', SOURCE_COLORS[item.source] ?? 'text-ledger-gray-400')}>
                                    {item.source}
                                </span>
                                <span className="text-ledger-gray-300 text-[11px]">·</span>
                                <span className="text-[11px] text-ledger-gray-400">{relativeTime(item.publishedAt)}</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

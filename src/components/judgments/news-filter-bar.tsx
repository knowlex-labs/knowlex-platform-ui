import { useRef, useState, useEffect } from 'react'
import { CalendarDays } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NewsFilters, NewsSource, NewsCategory } from '@/types'

const SOURCES: { value: NewsSource | ''; label: string }[] = [
    { value: '', label: 'All Sources' },
    { value: 'LiveLaw', label: 'LiveLaw' },
    { value: 'BarAndBench', label: 'Bar & Bench' },
]

const CATEGORIES: { value: NewsCategory | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'top-stories', label: 'Top Stories' },
    { value: 'supreme-court', label: 'Supreme Court' },
    { value: 'high-court', label: 'High Court' },
    { value: 'trending', label: 'Trending' },
]

function DateRangePopover({
    fromDate,
    toDate,
    onChange,
}: {
    fromDate?: string
    toDate?: string
    onChange: (from: string | undefined, to: string | undefined) => void
}) {
    const [open, setOpen] = useState(false)
    const [draftFrom, setDraftFrom] = useState(fromDate)
    const [draftTo, setDraftTo] = useState(toDate)
    const containerRef = useRef<HTMLDivElement>(null)
    const hasDate = !!(fromDate || toDate)

    useEffect(() => {
        if (open) { setDraftFrom(fromDate); setDraftTo(toDate) }
    }, [open, fromDate, toDate])

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node
            if ((target as Element).closest?.('[data-radix-popper-content-wrapper]')) return
            if (containerRef.current && !containerRef.current.contains(target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    useEffect(() => {
        if (!open) return
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open])

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                    hasDate
                        ? 'border-kx-primary-600 bg-kx-primary-50 text-kx-primary-700'
                        : 'border-ledger-gray-300 text-ledger-gray-500 hover:border-ledger-gray-400 hover:text-ledger-gray-700'
                )}
            >
                <CalendarDays className="h-3.5 w-3.5" />
                {hasDate ? 'Date filtered' : 'Date range'}
                {hasDate && (
                    <span className="h-1.5 w-1.5 rounded-full bg-kx-primary-600" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[272px] rounded-xl border border-ledger-gray-200 bg-ledger-white shadow-xl">
                    <div className="p-4 space-y-3">
                        <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wider">Date Range</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs text-ledger-gray-400">From</label>
                                <DatePicker value={draftFrom} onChange={setDraftFrom} placeholder="Start" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ledger-gray-400">To</label>
                                <DatePicker value={draftTo} onChange={setDraftTo} placeholder="End" />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button variant="primary" size="sm" className="flex-1"
                                onClick={() => { onChange(draftFrom, draftTo); setOpen(false) }}>
                                Apply
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 text-ledger-gray-500"
                                onClick={() => { setDraftFrom(undefined); setDraftTo(undefined); onChange(undefined, undefined); setOpen(false) }}>
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface NewsFilterBarProps {
    filters: NewsFilters
    onFiltersChange: (filters: NewsFilters) => void
}

export function NewsFilterBar({ filters, onFiltersChange }: NewsFilterBarProps) {
    const activeSource = filters.source ?? ''
    const activeCategory = filters.category ?? ''

    return (
        <div className="space-y-2.5">
            {/* Source row */}
            <div className="flex items-center gap-1.5">
                {SOURCES.map(({ value, label }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onFiltersChange({ ...filters, source: value as NewsSource | '' })}
                        className={cn(
                            'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                            activeSource === value
                                ? 'bg-kx-primary-900 text-white shadow-sm'
                                : 'text-ledger-gray-600 hover:bg-ledger-gray-100 hover:text-kx-primary-800'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Category row */}
            <div className="flex items-center gap-1.5">
                {CATEGORIES.map(({ value, label }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onFiltersChange({ ...filters, category: value as NewsCategory | '' })}
                        className={cn(
                            'px-3.5 py-1 rounded-full text-xs font-medium transition-all border',
                            activeCategory === value
                                ? 'bg-kx-primary-100 border-kx-primary-300 text-kx-primary-800'
                                : 'border-transparent text-ledger-gray-500 hover:bg-ledger-gray-100 hover:text-ledger-gray-700'
                        )}
                    >
                        {label}
                    </button>
                ))}

                <div className="ml-auto">
                    <DateRangePopover
                        fromDate={filters.fromDate}
                        toDate={filters.toDate}
                        onChange={(from, to) => onFiltersChange({ ...filters, fromDate: from, toDate: to })}
                    />
                </div>
            </div>
        </div>
    )
}

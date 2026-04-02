import { useRef, useState, useEffect } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import type { NewsFilters, NewsSource, NewsCategory } from '@/types'

const SOURCES: { value: NewsSource | ''; label: string }[] = [
    { value: '', label: 'All Sources' },
    { value: 'LiveLaw', label: 'LiveLaw' },
    { value: 'BarAndBench', label: 'Bar & Bench' },
]

const CATEGORIES: { value: NewsCategory | ''; label: string }[] = [
    { value: '', label: 'All Categories' },
    { value: 'top-stories', label: 'Top Stories' },
    { value: 'supreme-court', label: 'Supreme Court' },
    { value: 'high-court', label: 'High Court' },
    { value: 'trending', label: 'Trending' },
]

interface DateRangeDropdownProps {
    fromDate?: string
    toDate?: string
    onChange: (from: string | undefined, to: string | undefined) => void
    badgeCount: number
}

function DateRangeDropdown({ fromDate, toDate, onChange, badgeCount }: DateRangeDropdownProps) {
    const [open, setOpen] = useState(false)
    const [draftFrom, setDraftFrom] = useState(fromDate)
    const [draftTo, setDraftTo] = useState(toDate)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open) {
            setDraftFrom(fromDate)
            setDraftTo(toDate)
        }
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

    const handleApply = () => {
        onChange(draftFrom, draftTo)
        setOpen(false)
    }

    const handleClear = () => {
        setDraftFrom(undefined)
        setDraftTo(undefined)
        onChange(undefined, undefined)
        setOpen(false)
    }

    return (
        <div ref={containerRef} className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(!open)}
                className="gap-1.5 text-ledger-gray-600 hover:text-kx-primary-700"
            >
                <SlidersHorizontal className="h-4 w-4" />
                Date Range
                {badgeCount > 0 && (
                    <span className="flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-kx-primary-600 text-white text-xs font-medium">
                        {badgeCount}
                    </span>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 z-50 mt-1 w-[280px] rounded-lg border border-ledger-gray-200 bg-ledger-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="p-4 space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-ledger-gray-400">From</label>
                                    <DatePicker
                                        value={draftFrom}
                                        onChange={setDraftFrom}
                                        placeholder="Start date"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-ledger-gray-400">To</label>
                                    <DatePicker
                                        value={draftTo}
                                        onChange={setDraftTo}
                                        placeholder="End date"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-ledger-gray-200 pt-3 flex items-center gap-2">
                            <Button variant="primary" size="sm" onClick={handleApply} className="flex-1">
                                Apply
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="flex-1 text-ledger-gray-500 hover:text-kx-primary-700"
                            >
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
    const dateRangeBadge = [filters.fromDate, filters.toDate].filter(Boolean).length

    return (
        <div className="space-y-3">
            {/* Source tabs */}
            <div className="flex items-center gap-1">
                {SOURCES.map(({ value, label }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onFiltersChange({ ...filters, source: value as NewsSource | '' })}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            filters.source === value || (!filters.source && value === '')
                                ? 'bg-kx-primary-600 text-white'
                                : 'text-ledger-gray-600 hover:bg-ledger-gray-100 hover:text-kx-primary-700'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Category + Date range row */}
            <div className="flex items-center gap-2 p-3 bg-ledger-gray-50 rounded-lg border border-ledger-gray-200">
                <Select
                    value={filters.category ?? ''}
                    onChange={(e) =>
                        onFiltersChange({ ...filters, category: e.target.value as NewsCategory | '' })
                    }
                    className="w-[180px]"
                >
                    {CATEGORIES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </Select>

                <div className="ml-auto">
                    <DateRangeDropdown
                        fromDate={filters.fromDate}
                        toDate={filters.toDate}
                        onChange={(from, to) => onFiltersChange({ ...filters, fromDate: from, toDate: to })}
                        badgeCount={dateRangeBadge}
                    />
                </div>
            </div>
        </div>
    )
}

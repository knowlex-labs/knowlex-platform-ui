import { useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { judgmentsApi } from '@/services/api/judgments-api'
import type { JudgmentFilters } from '@/types'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i)

// --- AdvancedFiltersDropdown ---

interface AdvancedFields {
    court?: string
    disposalNature?: string[]
    dateFrom?: string
    dateTo?: string
}

function pickAdvanced(filters: JudgmentFilters): AdvancedFields {
    return {
        court: filters.court,
        disposalNature: filters.disposalNature,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
    }
}

function countAdvanced(fields: AdvancedFields): number {
    return [
        fields.court,
        fields.disposalNature?.length ? fields.disposalNature : undefined,
        fields.dateFrom,
        fields.dateTo,
    ].filter(Boolean).length
}

function AdvancedFiltersDropdown({
    filters,
    onFiltersChange,
    courts,
    disposalNatures,
    badgeCount,
}: {
    filters: JudgmentFilters
    onFiltersChange: (filters: JudgmentFilters) => void
    courts: string[]
    disposalNatures: string[]
    badgeCount: number
}) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<AdvancedFields>(() => pickAdvanced(filters))
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync draft when dropdown opens
    useEffect(() => {
        if (open) {
            setDraft(pickAdvanced(filters))
        }
    }, [open, filters])

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open])

    const handleApply = () => {
        onFiltersChange({
            ...filters,
            court: draft.court,
            disposalNature: draft.disposalNature,
            dateFrom: draft.dateFrom,
            dateTo: draft.dateTo,
        })
        setOpen(false)
    }

    const handleClear = () => {
        const cleared: AdvancedFields = {
            court: undefined,
            disposalNature: undefined,
            dateFrom: undefined,
            dateTo: undefined,
        }
        setDraft(cleared)
        onFiltersChange({
            ...filters,
            ...cleared,
        })
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
                Filters
                {badgeCount > 0 && (
                    <span className="flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-kx-primary-600 text-white text-xs font-medium">
                        {badgeCount}
                    </span>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 z-50 mt-1 w-[320px] rounded-lg border border-ledger-gray-200 bg-ledger-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="p-4 space-y-3">
                        {/* Court */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">Court</label>
                            <Select
                                value={draft.court ?? ''}
                                onChange={(e) => setDraft({ ...draft, court: e.target.value || undefined })}
                                searchable
                                searchPlaceholder="Search court..."
                                className="w-full"
                            >
                                <option value="">All Courts</option>
                                {courts.map((court) => (
                                    <option key={court} value={court}>{court}</option>
                                ))}
                            </Select>
                        </div>

                        {/* Verdict */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">Verdict</label>
                            <Select
                                value={draft.disposalNature?.[0] ?? ''}
                                onChange={(e) => setDraft({
                                    ...draft,
                                    disposalNature: e.target.value ? [e.target.value] : undefined,
                                })}
                                className="w-full"
                            >
                                <option value="">All Verdicts</option>
                                {disposalNatures.map((nature) => (
                                    <option key={nature} value={nature}>{nature}</option>
                                ))}
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-1.5">
                            <div className="border-t border-ledger-gray-200 pt-3">
                                <label className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">Date Range</label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-ledger-gray-400">From</label>
                                    <button
                                        type="button"
                                        className="relative w-full"
                                        onClick={(e) => {
                                            const input = e.currentTarget.querySelector('input')
                                            input?.showPicker()
                                        }}
                                    >
                                        <Input
                                            type="date"
                                            value={draft.dateFrom ?? ''}
                                            onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value || undefined })}
                                            className="h-9 text-sm cursor-pointer"
                                        />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-ledger-gray-400">To</label>
                                    <button
                                        type="button"
                                        className="relative w-full"
                                        onClick={(e) => {
                                            const input = e.currentTarget.querySelector('input')
                                            input?.showPicker()
                                        }}
                                    >
                                        <Input
                                            type="date"
                                            value={draft.dateTo ?? ''}
                                            onChange={(e) => setDraft({ ...draft, dateTo: e.target.value || undefined })}
                                            className="h-9 text-sm cursor-pointer"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Apply & Clear buttons */}
                        <div className="border-t border-ledger-gray-200 pt-3 flex items-center gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleApply}
                                className="flex-1"
                            >
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

// --- Main Filter Bar ---

interface JudgmentFiltersBarProps {
    filters: JudgmentFilters
    onFiltersChange: (filters: JudgmentFilters) => void
}

export function JudgmentFiltersBar({ filters, onFiltersChange }: JudgmentFiltersBarProps) {
    const [disposalNatures, setDisposalNatures] = useState<string[]>([])
    const [courts, setCourts] = useState<string[]>([])
    const [judges, setJudges] = useState<string[]>([])

    useEffect(() => {
        judgmentsApi.getDisposalNatures()
            .then(setDisposalNatures)
            .catch(() => {/* non-fatal */})
        judgmentsApi.getCourts()
            .then(setCourts)
            .catch(() => {/* non-fatal */})
        judgmentsApi.getJudges()
            .then(setJudges)
            .catch(() => {/* non-fatal */})
    }, [])

    const advancedBadgeCount = countAdvanced(pickAdvanced(filters))

    const handleReset = () => {
        onFiltersChange({})
    }

    return (
        <div className="flex items-center gap-2 p-3 bg-ledger-gray-50 rounded-lg border border-ledger-gray-200">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-gray-400" />
                <Input
                    placeholder="Search by title, petitioner, respondent..."
                    value={filters.search || ''}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
                    className="h-9 pl-9 text-sm"
                />
            </div>

            {/* Judge (top-level) */}
            <Select
                value={filters.judge ?? ''}
                onChange={(e) => onFiltersChange({ ...filters, judge: e.target.value || undefined })}
                searchable
                searchPlaceholder="Search judge..."
                className="w-[170px]"
            >
                <option value="">All Judges</option>
                {judges.map((judge) => (
                    <option key={judge} value={judge}>{judge}</option>
                ))}
            </Select>

            {/* Year */}
            <Select
                value={filters.year?.toString() ?? ''}
                onChange={(e) => {
                    const year = e.target.value ? parseInt(e.target.value) : undefined
                    onFiltersChange({ ...filters, year })
                }}
                searchable
                searchPlaceholder="Type a year..."
                className="w-[130px]"
            >
                <option value="">All Years</option>
                {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </Select>

            {/* Advanced Filters */}
            <AdvancedFiltersDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                courts={courts}
                disposalNatures={disposalNatures}
                badgeCount={advancedBadgeCount}
            />

            {/* Reset */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1 text-ledger-gray-600 hover:text-kx-primary-700"
            >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
            </Button>
        </div>
    )
}

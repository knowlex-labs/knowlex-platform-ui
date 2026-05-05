import { FileText, Users, Gavel, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Judgment, JudgmentSort, SortField } from '@knowlex/core/types'
import { formatJudgmentDate, getDisposalColor } from './judgment-utils'

interface JudgmentTableProps {
    judgments: Judgment[]
    isLoading: boolean
    sorts: JudgmentSort[]
    toggleSort: (field: SortField, multi?: boolean) => void
}

export function JudgmentTable({ judgments, isLoading, sorts, toggleSort }: JudgmentTableProps) {
    const navigate = useNavigate()

    if (isLoading) {
        return <JudgmentTableSkeleton />
    }

    if (judgments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-200 flex items-center justify-center mb-4">
                    <Gavel className="h-7 w-7 text-ledger-gray-400" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-kx-text-primary mb-1">
                    No judgments found
                </h3>
                <p className="text-sm text-ledger-gray-500 max-w-sm">
                    Try adjusting your filters to find what you're looking for.
                </p>
            </div>
        )
    }

    return (
        <div className="border border-kx-card-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-ledger-gray-50 dark:bg-ledger-gray-100 border-b border-kx-card-border">
                            <SortableHeader label="Citation" field="citation" sorts={sorts} onToggle={toggleSort} />
                            <SortableHeader label="Title" field="title" sorts={sorts} onToggle={toggleSort} />
                            <SortableHeader label="Court" field="court" sorts={sorts} onToggle={toggleSort} className="hidden lg:table-cell" />
                            <SortableHeader label="Judge(s)" field="authorJudge" sorts={sorts} onToggle={toggleSort} className="hidden md:table-cell" />
                            <SortableHeader label="Decision Date" field="decisionDate" sorts={sorts} onToggle={toggleSort} />
                            <SortableHeader label="Verdict" field="disposalNature" sorts={sorts} onToggle={toggleSort} className="hidden xl:table-cell" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kx-card-border">
                        {judgments.map((judgment) => (
                            <tr
                                key={judgment.id}
                                onClick={() => navigate(`/judgments/${judgment.id}`)}
                                className={cn(
                                    'bg-kx-card cursor-pointer transition-all duration-150 group',
                                    'hover:bg-kx-primary-50 dark:hover:bg-kx-primary-50',
                                    'border-l-2 border-l-transparent hover:border-l-kx-primary-500'
                                )}
                            >
                                {/* Citation */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-kx-primary-600 bg-kx-primary-50 dark:bg-kx-primary-100 px-2 py-1 rounded">
                                        <FileText className="h-3 w-3" />
                                        {judgment.citation || '—'}
                                    </span>
                                </td>

                                {/* Title */}
                                <td className="px-4 py-3 max-w-xs">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-kx-text-primary line-clamp-1">
                                            {judgment.petitioner || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-ledger-gray-500 italic">
                                            v. {judgment.respondent || 'Unknown'}
                                        </p>
                                    </div>
                                </td>

                                {/* Court */}
                                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                                    <span className="text-xs text-ledger-gray-600">
                                        {judgment.court}
                                    </span>
                                </td>

                                {/* Judge(s) */}
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <div className="flex items-center gap-1 max-w-[180px]">
                                        <Users className="h-3 w-3 text-ledger-gray-400 flex-shrink-0" />
                                        <span className="text-xs text-ledger-gray-600 truncate">
                                            {judgment.judges?.join(', ') || '—'}
                                        </span>
                                    </div>
                                </td>

                                {/* Judgment Date */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-xs text-ledger-gray-600">
                                        {formatJudgmentDate(judgment.decisionDate)}
                                    </span>
                                </td>

                                {/* Disposal Nature */}
                                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell">
                                    {judgment.disposalNature ? (
                                        <span className={cn(
                                            'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
                                            getDisposalColor(judgment.disposalNature)
                                        )}>
                                            {judgment.disposalNature}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-ledger-gray-400">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function SortableHeader({
    label,
    field,
    sorts,
    onToggle,
    className,
}: {
    label: string
    field: SortField
    sorts: JudgmentSort[]
    onToggle: (field: SortField, multi?: boolean) => void
    className?: string
}) {
    const idx = sorts.findIndex((s) => s.field === field)
    const direction = idx === -1 ? null : sorts[idx].direction
    const isActive = idx !== -1
    const showPriority = isActive && sorts.length > 1
    const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown

    return (
        <th
            className={cn(
                'text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap',
                'cursor-pointer select-none hover:text-kx-primary-600 transition-colors',
                isActive && 'text-kx-primary-700',
                className
            )}
            onClick={(e) => onToggle(field, e.shiftKey)}
            title="Click to sort. Shift-click to add as a secondary sort."
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <Icon
                    className={cn(
                        'h-3.5 w-3.5',
                        isActive ? 'text-kx-primary-600' : 'text-ledger-gray-400'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                {showPriority && (
                    <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-kx-primary-100 text-kx-primary-700 text-[10px] font-semibold">
                        {idx + 1}
                    </span>
                )}
            </span>
        </th>
    )
}

function JudgmentTableSkeleton() {
    return (
        <div className="border border-kx-card-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-ledger-gray-50 dark:bg-ledger-gray-100 border-b border-kx-card-border">
                            <th className="text-left px-4 py-3"><div className="h-3 w-20 bg-ledger-gray-200 rounded animate-pulse" /></th>
                            <th className="text-left px-4 py-3"><div className="h-3 w-16 bg-ledger-gray-200 rounded animate-pulse" /></th>
                            <th className="text-left px-4 py-3 hidden lg:table-cell"><div className="h-3 w-14 bg-ledger-gray-200 rounded animate-pulse" /></th>
                            <th className="text-left px-4 py-3 hidden md:table-cell"><div className="h-3 w-16 bg-ledger-gray-200 rounded animate-pulse" /></th>
                            <th className="text-left px-4 py-3"><div className="h-3 w-12 bg-ledger-gray-200 rounded animate-pulse" /></th>
                            <th className="text-left px-4 py-3 hidden xl:table-cell"><div className="h-3 w-16 bg-ledger-gray-200 rounded animate-pulse" /></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kx-card-border">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <tr key={i} className="bg-kx-card">
                                <td className="px-4 py-3"><div className="h-6 w-32 bg-ledger-gray-100 rounded animate-pulse" /></td>
                                <td className="px-4 py-3">
                                    <div className="space-y-1">
                                        <div className="h-4 w-48 bg-ledger-gray-100 rounded animate-pulse" />
                                        <div className="h-3 w-36 bg-ledger-gray-100 rounded animate-pulse" />
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-28 bg-ledger-gray-100 rounded animate-pulse" /></td>
                                <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-24 bg-ledger-gray-100 rounded animate-pulse" /></td>
                                <td className="px-4 py-3"><div className="h-4 w-12 bg-ledger-gray-100 rounded animate-pulse" /></td>
                                <td className="px-4 py-3 hidden xl:table-cell"><div className="h-5 w-20 bg-ledger-gray-100 rounded-full animate-pulse" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

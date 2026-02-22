import { FileText, Users, Gavel, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Judgment, JudgmentSort, SortField } from '@/types'
import { formatJudgmentDate, getDisposalColor } from './judgment-utils'

interface JudgmentTableProps {
    judgments: Judgment[]
    isLoading: boolean
    sort: JudgmentSort | null
    toggleSort: (field: SortField) => void
}

export function JudgmentTable({ judgments, isLoading, sort, toggleSort }: JudgmentTableProps) {
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
                            <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                                Citation
                            </th>
                            <SortableHeader
                                label="Title"
                                field="title"
                                sort={sort}
                                onToggle={toggleSort}
                            />
                            <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                                Court
                            </th>
                            <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                                Judge(s)
                            </th>
                            <SortableHeader
                                label="Decision Date"
                                field="decisionDate"
                                sort={sort}
                                onToggle={toggleSort}
                            />
                            <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">
                                Verdict
                            </th>
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
    sort,
    onToggle,
    className,
}: {
    label: string
    field: SortField
    sort: JudgmentSort | null
    onToggle: (field: SortField) => void
    className?: string
}) {
    const isActive = sort?.field === field
    const direction = isActive ? sort.direction : null

    const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown

    return (
        <th
            className={cn(
                'text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap',
                'cursor-pointer select-none hover:text-kx-primary-600 transition-colors',
                className
            )}
            onClick={() => onToggle(field)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <Icon className={cn(
                    'h-3 w-3',
                    isActive ? 'text-kx-primary-600' : 'text-ledger-gray-400'
                )} />
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

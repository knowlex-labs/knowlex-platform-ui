import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface JudgmentPaginationProps {
    page: number
    totalPages: number
    totalElements: number
    size: number
    onPageChange: (page: number) => void
    label?: string
    /** When set, shows a “Rows per page” control (documents-style). */
    onPageSizeChange?: (size: number) => void
    pageSizeOptions?: number[]
    /** `htmlFor` on the label / `id` on the hidden select (unique per tab). */
    rowsSelectId?: string
}

export function JudgmentPagination({
    page,
    totalPages,
    totalElements = 0,
    size = 10,
    onPageChange,
    label = 'judgments',
    onPageSizeChange,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    rowsSelectId = 'judgment-pagination-rows',
}: JudgmentPaginationProps) {
    if (totalElements < 1) return null
    if (!onPageSizeChange && (!totalPages || totalPages <= 1)) return null

    const startItem = page * size + 1
    const endItem = Math.min((page + 1) * size, totalElements)
    const showPageButtons = totalPages > 1

    const getVisiblePages = (): number[] => {
        const pages: number[] = []
        const start = Math.max(0, page - 2)
        const end = Math.min(totalPages - 1, page + 2)
        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        return pages
    }

    const visiblePages = getVisiblePages()

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
                {onPageSizeChange && (
                    <div className="flex shrink-0 items-center gap-2">
                        <label
                            htmlFor={rowsSelectId}
                            className="shrink-0 text-xs text-ledger-gray-500 whitespace-nowrap"
                        >
                            Rows per page
                        </label>
                        <div className="w-20 shrink-0">
                            <Select
                                id={rowsSelectId}
                                listPlacement="top"
                                value={String(size)}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="h-8 text-xs"
                            >
                                {pageSizeOptions.map((n) => (
                                    <option key={n} value={String(n)}>
                                        {n}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>
                )}
                <p className="shrink-0 text-sm text-ledger-gray-500 whitespace-nowrap">
                    <span className="font-medium text-kx-text-primary">{startItem.toLocaleString()}</span>
                    –
                    <span className="font-medium text-kx-text-primary">{endItem.toLocaleString()}</span>
                    {' '}of{' '}
                    <span className="font-medium text-kx-text-primary">{totalElements.toLocaleString()}</span>
                    {' '}
                    {label}
                </p>
            </div>

            {showPageButtons && (
                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(0)}
                        disabled={page === 0}
                        className="h-8 w-8 p-0"
                        title="First page"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 0}
                        className="h-8 w-8 p-0"
                        title="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {visiblePages[0] > 0 && (
                        <span className="text-xs text-ledger-gray-400 px-1">…</span>
                    )}

                    {visiblePages.map((p) => (
                        <Button
                            key={p}
                            variant={p === page ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => onPageChange(p)}
                            className={cn(
                                'h-8 w-8 p-0 text-xs font-medium',
                                p === page && 'pointer-events-none'
                            )}
                        >
                            {p + 1}
                        </Button>
                    ))}

                    {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                        <span className="text-xs text-ledger-gray-400 px-1">…</span>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="h-8 w-8 p-0"
                        title="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(totalPages - 1)}
                        disabled={page >= totalPages - 1}
                        className="h-8 w-8 p-0"
                        title="Last page"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CauseListPaginationProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPageChange: (page: number) => void
}

export function CauseListPagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
}: CauseListPaginationProps) {
  if (totalPages <= 1) return null

  const startItem = page * size + 1
  const endItem = Math.min((page + 1) * size, totalElements)

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
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="text-sm text-ledger-gray-500 whitespace-nowrap">
        <span className="font-medium text-kx-text-primary">{startItem.toLocaleString()}</span>
        {' '}&ndash;{' '}
        <span className="font-medium text-kx-text-primary">{endItem.toLocaleString()}</span>
        {' '}of{' '}
        <span className="font-medium text-kx-text-primary">{totalElements.toLocaleString()}</span>
        {' '}entries
      </p>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onPageChange(0)} disabled={page === 0} className="h-8 w-8 p-0" title="First page">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0} className="h-8 w-8 p-0" title="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {visiblePages[0] > 0 && <span className="text-xs text-ledger-gray-400 px-1">&hellip;</span>}

        {visiblePages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(p)}
            className={cn('h-8 w-8 p-0 text-xs font-medium', p === page && 'pointer-events-none')}
          >
            {p + 1}
          </Button>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="text-xs text-ledger-gray-400 px-1">&hellip;</span>}

        <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} className="h-8 w-8 p-0" title="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} className="h-8 w-8 p-0" title="Last page">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

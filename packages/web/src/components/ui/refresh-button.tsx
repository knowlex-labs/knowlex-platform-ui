import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RefreshButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function RefreshButton({ onClick, isLoading, disabled, className }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled ?? isLoading}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium transition-colors',
        'border border-kx-card-border bg-transparent text-kx-primary-700',
        'hover:bg-kx-primary-50 hover:border-kx-primary-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
      Refresh
    </button>
  )
}

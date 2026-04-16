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
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        'text-ledger-gray-400 hover:text-kx-primary-700 hover:bg-ledger-gray-100',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
      Refresh
    </button>
  )
}

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RefreshButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function RefreshButton({ onClick, isLoading, disabled, className }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled ?? isLoading}
      className={`gap-2 h-9 min-h-0 px-3 text-sm ${className ?? ''}`}
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  )
}

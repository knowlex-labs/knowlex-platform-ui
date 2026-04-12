import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
}

export function EmptyState({ icon: Icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  const isSm = size === 'sm'
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-6 px-4', className)}>
      <div className={cn(
        'rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-800 flex items-center justify-center mb-3',
        isSm ? 'h-9 w-9' : 'h-12 w-12'
      )}>
        <Icon className={cn('text-ledger-gray-400', isSm ? 'h-4 w-4' : 'h-5 w-5')} />
      </div>
      <p className={cn('font-medium text-kx-text-primary', isSm ? 'text-xs' : 'text-sm')}>{title}</p>
      {description && (
        <p className={cn('text-ledger-gray-400 mt-0.5', isSm ? 'text-[10px]' : 'text-xs')}>{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

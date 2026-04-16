import { cn } from '@/lib/utils'

interface DemoBadgeProps {
  className?: string
}

export function DemoBadge({ className }: DemoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium',
        'bg-ledger-gray-100 text-ledger-gray-500 rounded',
        'uppercase tracking-wide',
        className
      )}
    >
      Demo
    </span>
  )
}

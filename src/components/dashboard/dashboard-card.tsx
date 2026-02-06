import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
  children: React.ReactNode
  className?: string
}

export function DashboardCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-ledger-gray-200 rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-gray-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-ledger-gray-500" />}
          <h3 className="text-sm font-medium text-ledger-black">{title}</h3>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 text-xs text-ledger-gray-500 hover:text-ledger-black transition-colors"
          >
            {action.label}
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

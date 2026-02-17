import type { LucideIcon } from 'lucide-react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudioToolCardProps {
  id: string
  name: string
  icon: LucideIcon
  disabled?: boolean
  onClick: () => void
  onEditClick?: () => void
}

export function StudioToolCard({
  name,
  icon: Icon,
  disabled = false,
  onClick,
  onEditClick,
}: StudioToolCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex items-center gap-3 p-3',
        'bg-ledger-gray-50/60 rounded-lg border-l-2 border-l-transparent',
        'hover:bg-ledger-gray-100 hover:shadow-sm hover:border-l-kx-primary-600',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-kx-primary-500',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-ledger-gray-50/60 hover:shadow-none hover:border-l-transparent'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
          'bg-ledger-gray-100 text-ledger-gray-600',
          'group-hover:bg-kx-primary-600 group-hover:text-white',
          'transition-colors duration-150',
          disabled && 'group-hover:bg-ledger-gray-100 group-hover:text-ledger-gray-600'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-kx-primary-900 leading-tight">
        {name}
      </span>

      {/* Edit button - right side, visible on hover */}
      {onEditClick && !disabled && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onEditClick()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              onEditClick()
            }
          }}
          className={cn(
            'ml-auto p-1.5 rounded cursor-pointer',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-ledger-gray-200 transition-opacity'
          )}
        >
          <Pencil className="h-3.5 w-3.5 text-ledger-gray-500" />
        </div>
      )}
    </button>
  )
}

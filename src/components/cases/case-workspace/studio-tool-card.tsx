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
        'bg-ledger-gray-50/60 rounded-lg',
        'hover:bg-ledger-gray-100',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ledger-black',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-ledger-gray-50/60'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
          'bg-ledger-gray-200/60 text-ledger-gray-600',
          'group-hover:bg-ledger-gray-200 group-hover:text-ledger-black',
          'transition-colors duration-150',
          disabled && 'group-hover:bg-ledger-gray-200/60 group-hover:text-ledger-gray-600'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-ledger-black leading-tight">
        {name}
      </span>

      {/* Edit button - right side, visible on hover */}
      {onEditClick && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditClick()
          }}
          className={cn(
            'ml-auto p-1.5 rounded',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-ledger-gray-200 transition-opacity'
          )}
        >
          <Pencil className="h-3.5 w-3.5 text-ledger-gray-500" />
        </button>
      )}
    </button>
  )
}

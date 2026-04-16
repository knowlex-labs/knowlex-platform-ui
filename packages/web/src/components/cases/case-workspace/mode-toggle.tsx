import { PenLine, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WorkspaceMode = 'draft' | 'research'

interface ModeToggleProps {
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
}

const modes = [
  { value: 'research' as const, label: 'Research', icon: Bot },
  { value: 'draft' as const, label: 'Draft', icon: PenLine },
]

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex h-9 rounded-lg border border-ledger-gray-200 overflow-hidden shadow-sm">
      {modes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onModeChange(value)}
          className={cn(
            'flex items-center gap-1.5 px-4 text-sm font-medium transition-colors',
            mode === value
              ? 'bg-kx-primary-600 text-white'
              : 'text-ledger-gray-600 hover:bg-ledger-gray-50'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}

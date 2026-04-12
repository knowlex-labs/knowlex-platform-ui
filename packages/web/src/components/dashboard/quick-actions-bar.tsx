import { UserPlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuickActionsBarProps {
  onNewCase: () => void
  onNewClient: () => void
}

export function QuickActionsBar({ onNewCase, onNewClient }: QuickActionsBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onNewCase}
        size="sm"
        className="gap-1.5 h-8 px-3 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        New Case
      </Button>
      <Button
        onClick={onNewClient}
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 px-3 text-xs"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add Client
      </Button>
    </div>
  )
}

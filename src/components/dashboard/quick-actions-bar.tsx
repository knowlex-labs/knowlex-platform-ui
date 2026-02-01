import { UserPlus, Brain, Plus } from 'lucide-react'

interface QuickActionsBarProps {
  onNewCase: () => void
  onNewClient: () => void
  onResearch: () => void
}

export function QuickActionsBar({ onNewCase, onNewClient, onResearch }: QuickActionsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Button
        onClick={onNewCase}
        variant="outline"
        className="h-auto flex flex-col items-center gap-2 py-4 hover:bg-ledger-gray-50 transition-colors"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-ledger-gray-900">New Case</div>
          <div className="text-xs text-ledger-gray-500 mt-0.5">Start a new case</div>
        </div>
      </Button>

      <Button
        onClick={onNewClient}
        variant="outline"
        className="h-auto flex flex-col items-center gap-2 py-4 hover:bg-ledger-gray-50 transition-colors"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-ledger-gray-900">Add Client</div>
          <div className="text-xs text-ledger-gray-500 mt-0.5">Register new client</div>
        </div>
      </Button>

      <Button
        onClick={onResearch}
        variant="outline"
        className="h-auto flex flex-col items-center gap-2 py-4 hover:bg-ledger-gray-50 transition-colors"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600">
          <Brain className="h-5 w-5" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-ledger-gray-900">AI Research</div>
          <div className="text-xs text-ledger-gray-500 mt-0.5">Start AI research</div>
        </div>
      </Button>
    </div>
  )
}

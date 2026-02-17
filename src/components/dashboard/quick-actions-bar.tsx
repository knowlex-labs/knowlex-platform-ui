import { UserPlus, Brain, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuickActionsBarProps {
  onNewCase: () => void
  onNewClient: () => void
  onResearch: () => void
}

interface QuickAction {
  icon: LucideIcon
  title: string
  subtitle: string
  iconColors: string
  hoverGlow: string
}

const ACTIONS: QuickAction[] = [
  {
    icon: Plus,
    title: 'New Case',
    subtitle: 'Start a new case',
    iconColors: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    hoverGlow: 'dark:hover:border-blue-500/50 dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  },
  {
    icon: UserPlus,
    title: 'Add Client',
    subtitle: 'Register new client',
    iconColors: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    hoverGlow: 'dark:hover:border-green-500/50 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]',
  },
  {
    icon: Brain,
    title: 'AI Research',
    subtitle: 'Start AI research',
    iconColors: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    hoverGlow: 'dark:hover:border-purple-500/50 dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
]

export function QuickActionsBar({ onNewCase, onNewClient, onResearch }: QuickActionsBarProps) {
  const handlers = [onNewCase, onNewClient, onResearch]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ACTIONS.map((action, index) => (
        <Button
          key={action.title}
          onClick={handlers[index]}
          variant="outline"
          className={`h-auto flex flex-col items-center gap-2 py-4 hover:bg-ledger-gray-50 transition-all card-elevated glow-accent animate-bounce-in ${action.hoverGlow}`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${action.iconColors}`}>
            <action.icon className="h-5 w-5" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-ledger-gray-900">{action.title}</div>
            <div className="text-xs text-ledger-gray-500 mt-0.5">{action.subtitle}</div>
          </div>
        </Button>
      ))}
    </div>
  )
}

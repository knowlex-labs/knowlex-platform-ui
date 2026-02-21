import { Search, Loader2, Check } from 'lucide-react'
import type { AgentToolCall } from '@/types'
import { cn } from '@/lib/utils'

interface AgentToolCallCardProps {
  toolCall: AgentToolCall
}

const TOOL_CONFIG: Record<string, { label: string; icon: typeof Search; activeLabel: string }> = {
  search_sources: { label: 'Searched sources', icon: Search, activeLabel: 'Searching sources...' },
}

export function AgentToolCallCard({ toolCall }: AgentToolCallCardProps) {
  const config = TOOL_CONFIG[toolCall.name] || {
    label: toolCall.name,
    icon: Search,
    activeLabel: `Running ${toolCall.name}...`,
  }
  const Icon = config.icon
  const hasResult = !!toolCall.result

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs',
        hasResult
          ? 'border-kx-primary-200 bg-kx-primary-50/50'
          : 'border-ledger-gray-200 bg-ledger-gray-50'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center',
          hasResult ? 'bg-kx-primary-100 text-kx-primary-700' : 'bg-ledger-gray-100 text-ledger-gray-500'
        )}
      >
        {hasResult ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-ledger-gray-700 font-medium">
          {hasResult ? config.label : config.activeLabel}
        </span>
      </div>

      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-ledger-gray-400" />
    </div>
  )
}

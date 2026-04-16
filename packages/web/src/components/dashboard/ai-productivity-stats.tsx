import { Clock, FileText, FolderOpen, CheckCircle } from 'lucide-react'
import type { AiProductivityStats } from '@knowlex/core/types/dashboard.types'

interface AiProductivityStatsProps {
  stats: AiProductivityStats
  isLoading: boolean
}

const STATS_CONFIG = [
  {
    key: 'timeSavedHours' as const,
    label: 'Time Saved',
    suffix: 'hrs',
    icon: Clock,
    iconColors: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    key: 'draftsGenerated' as const,
    label: 'Drafts Generated',
    icon: FileText,
    iconColors: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    key: 'docsProcessed' as const,
    label: 'Docs Processed',
    icon: FolderOpen,
    iconColors: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    key: 'successRate' as const,
    label: 'Success Rate',
    suffix: '%',
    icon: CheckCircle,
    iconColors: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
]

export function AiProductivityStatsRow({ stats, isLoading }: AiProductivityStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS_CONFIG.map((cfg, index) => (
        <div
          key={cfg.key}
          className="bg-kx-card border border-kx-card-border rounded-lg p-4 shadow-sm animate-bounce-in"
          style={{ animationDelay: `${(index + 4) * 60}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconColors}`}>
              <cfg.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-7 w-12 bg-ledger-gray-200 rounded animate-pulse mb-0.5" />
              ) : (
                <p className="text-2xl font-bold text-kx-primary-900 leading-tight">
                  {stats[cfg.key]}
                  {cfg.suffix && <span className="text-sm font-medium text-ledger-gray-500 ml-0.5">{cfg.suffix}</span>}
                </p>
              )}
              <p className="text-xs text-ledger-gray-500 truncate">{cfg.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

import { Briefcase, FileText, UserPlus, Upload, CalendarDays } from 'lucide-react'
import type { ActivityFeedItem } from '@/types/dashboard.types'

interface ActivityFeedProps {
  items: ActivityFeedItem[]
}

const ICON_MAP: Record<ActivityFeedItem['type'], { icon: typeof Briefcase; colors: string }> = {
  case_created: {
    icon: Briefcase,
    colors: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  draft_generated: {
    icon: FileText,
    colors: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  client_added: {
    icon: UserPlus,
    colors: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  document_uploaded: {
    icon: Upload,
    colors: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  hearing_scheduled: {
    icon: CalendarDays,
    colors: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ledger-gray-500 text-center py-6">
        No recent activity
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => {
        const cfg = ICON_MAP[item.type]
        const Icon = cfg.icon
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.colors}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-kx-card-border min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 min-w-0 ${isLast ? '' : ''}`}>
              <p className="text-sm font-medium text-kx-primary-900 leading-tight">
                {item.title}
              </p>
              <p className="text-xs text-ledger-gray-500 mt-0.5 truncate">
                {item.description}
              </p>
              <p className="text-[11px] text-ledger-gray-400 mt-1">
                {timeAgo(item.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

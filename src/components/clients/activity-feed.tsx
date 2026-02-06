import type { ElementType } from 'react'
import {
  FileText,
  MessageSquare,
  Search,
  CreditCard,
  StickyNote,
  Gavel,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DemoBadge } from '@/components/ui/demo-badge'
import { cn } from '@/lib/utils'
import type { Activity, ActivityType } from '@/types'

interface ActivityFeedProps {
  activities: Activity[]
}

const activityIcons: Record<ActivityType, ElementType> = {
  filing: FileText,
  hearing: Gavel,
  document: FileText,
  communication: MessageSquare,
  research: Search,
  payment: CreditCard,
  note: StickyNote,
}

const activityColors: Record<ActivityType, string> = {
  filing: 'bg-ledger-black text-ledger-white',
  hearing: 'bg-ledger-gray-800 text-ledger-white',
  document: 'bg-ledger-gray-600 text-ledger-white',
  communication: 'bg-ledger-gray-500 text-ledger-white',
  research: 'bg-ledger-gray-400 text-ledger-white',
  payment: 'bg-ledger-gray-700 text-ledger-white',
  note: 'bg-ledger-gray-300 text-ledger-black',
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="border border-ledger-gray-200 rounded">
      <div className="px-4 py-3 border-b border-ledger-gray-200 bg-ledger-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-ledger-black">
          Activity Timeline
        </h3>
        <DemoBadge />
      </div>

      {/* Mobile: max-height with auto overflow, Desktop: fixed height */}
      <ScrollArea className="h-auto max-h-[50vh] md:h-[400px] md:max-h-none">
        <div className="p-4">
          <div className="relative">
            {/* Timeline line - positioned at center of icons (16px = half of 32px icon) */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-ledger-gray-200" />

            {/* Activities */}
            <div className="space-y-6">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.type]
                return (
                  <div
                    key={activity.id}
                    className="relative pl-12"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-sm',
                        activityColors[activity.type]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-ledger-gray-500 uppercase tracking-wide">
                          {activity.type}
                        </span>
                        <span className="text-xs text-ledger-gray-400">
                          {formatDate(activity.date)}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-ledger-black">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-ledger-gray-600 mt-1">
                        {activity.description}
                      </p>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-1 text-xs bg-ledger-gray-100 text-ledger-gray-600 rounded-sm"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

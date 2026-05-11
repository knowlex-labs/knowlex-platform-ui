import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { subscriptionApi } from '@knowlex/core/api/subscription-api'
import { cn } from '@/lib/utils'
import type { SubscriptionUsage } from '@knowlex/core/types'

function getUsagePercent(used: number, limit: number): number {
  if (limit === -1) return 0
  if (limit === 0) return 100
  return Math.min((used / limit) * 100, 100)
}

function getBarColor(percent: number): string {
  if (percent >= 95) return 'bg-red-500'
  if (percent >= 80) return 'bg-yellow-500'
  return 'bg-kx-primary-600'
}

function formatLimit(used: number, limit: number): string {
  return limit === -1 ? `${used} / ∞` : `${used} / ${limit}`
}

interface MiniBarProps {
  label: string
  used: number
  limit: number
  period?: string
}

function MiniBar({ label, used, limit, period }: MiniBarProps) {
  const percent = getUsagePercent(used, limit)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-ledger-gray-500">{label}</span>
          {period && (
            <span className="text-[9px] text-ledger-gray-400">{period}</span>
          )}
        </div>
        <span className="text-kx-primary-900 font-medium">{formatLimit(used, limit)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ledger-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(percent))}
          style={{ width: `${limit === -1 ? 0 : percent}%` }}
        />
      </div>
    </div>
  )
}

export function UsageWidget() {
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null)

  useEffect(() => {
    subscriptionApi.getUsage()
      .then(res => setUsage(res.data))
      .catch(() => { /* no subscription or error — hide widget */ })
  }, [])

  if (!usage) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-kx-primary-600" />
          <h2 className="text-sm font-semibold text-kx-primary-900">Usage</h2>
        </div>
        <Link
          to="/settings/billing"
          className="text-xs text-kx-primary-600 hover:text-kx-primary-700 font-medium"
        >
          View Billing
        </Link>
      </div>
      <div className="space-y-3">
        {usage.draftsLimit !== -1 && (
          <MiniBar label="Drafts" used={usage.draftsUsed} limit={usage.draftsLimit} period="weekly" />
        )}
        {(usage.chatMessagesLimit ?? -1) !== -1 && (
          <MiniBar label="Chat Messages" used={usage.chatMessagesUsed ?? 0} limit={usage.chatMessagesLimit ?? -1} period="weekly" />
        )}
        {usage.clientsLimit !== -1 && (
          <MiniBar label="Clients" used={usage.clientsUsed} limit={usage.clientsLimit} />
        )}
        {usage.casesLimit !== -1 && (
          <MiniBar label="Cases" used={usage.casesUsed} limit={usage.casesLimit} />
        )}
        {usage.storageMbLimit !== -1 && (
          <MiniBar label="Storage" used={usage.storageMbUsed} limit={usage.storageMbLimit} />
        )}
      </div>
    </div>
  )
}

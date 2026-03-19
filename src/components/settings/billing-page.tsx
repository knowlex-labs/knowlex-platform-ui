import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useSubscription } from '@/hooks/use-subscription'
import { cn } from '@/lib/utils'
import type { SubscriptionStatus } from '@/types'

const STATUS_BADGE_COLORS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  TRIALING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PAST_DUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatLimit(used: number, limit: number): string {
  if (limit === -1) return `${used} / Unlimited`
  return `${used} / ${limit}`
}

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

interface UsageBarProps {
  label: string
  used: number
  limit: number
  unit?: string
}

function UsageBar({ label, used, limit, unit }: UsageBarProps) {
  const percent = getUsagePercent(used, limit)
  const displayUsed = unit === 'MB' && used >= 1024 ? `${(used / 1024).toFixed(1)} GB` : `${used}${unit ? ` ${unit}` : ''}`
  const displayLimit = limit === -1 ? 'Unlimited' : unit === 'MB' && limit >= 1024 ? `${(limit / 1024).toFixed(0)} GB` : `${limit}${unit ? ` ${unit}` : ''}`

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ledger-gray-600">{label}</span>
        <span className="text-kx-primary-900 font-medium">{displayUsed} / {displayLimit}</span>
      </div>
      <div className="h-2 rounded-full bg-ledger-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(percent))}
          style={{ width: `${limit === -1 ? 0 : percent}%` }}
        />
      </div>
    </div>
  )
}

export function BillingPage() {
  const { subscription, usage, isLoading, cancelSubscription } = useSubscription()
  const navigate = useNavigate()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    try {
      setIsCancelling(true)
      await cancelSubscription({ reason: cancelReason || undefined })
      setShowCancelDialog(false)
      setCancelReason('')
    } catch {
      // Error is handled by the hook
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="max-w-2xl">
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6 text-center">
          <Info className="h-8 w-8 text-ledger-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-kx-primary-900 mb-2">No active subscription</h3>
          <p className="text-sm text-ledger-gray-500 mb-4">Choose a plan to get started with Knowlex.</p>
          <Button onClick={() => navigate('/plans')}>View Plans</Button>
        </div>
      </div>
    )
  }

  const isTrialing = subscription.status === 'TRIALING'
  const canCancel = subscription.status === 'ACTIVE' || subscription.status === 'TRIALING'

  return (
    <div className="max-w-2xl space-y-6">
      {/* Trial banner */}
      {isTrialing && subscription.trialEndDate && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Your free trial ends on <span className="font-semibold">{formatDate(subscription.trialEndDate)}</span>
          </p>
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-kx-primary-900">{subscription.planName}</h3>
            <span
              className={cn(
                'inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                STATUS_BADGE_COLORS[subscription.status]
              )}
            >
              {subscription.status}
            </span>
          </div>
          <span className="text-sm text-ledger-gray-500 capitalize">
            {subscription.billingCycle.toLowerCase()} billing
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-ledger-gray-500">Current period</p>
            <p className="text-kx-primary-900 font-medium">
              {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
          {subscription.cancelledAt && (
            <div>
              <p className="text-ledger-gray-500">Cancelled on</p>
              <p className="text-red-600 font-medium">{formatDate(subscription.cancelledAt)}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/plans')}>Change Plan</Button>
          {canCancel && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Usage section */}
      {usage && (
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-kx-primary-900 mb-4">Usage</h3>
          <div className="space-y-4">
            <UsageBar label="Drafts" used={usage.draftsUsed} limit={usage.draftsLimit} />
            <UsageBar label="Clients" used={usage.clientsUsed} limit={usage.clientsLimit} />
            <UsageBar label="Cases" used={usage.casesUsed} limit={usage.casesLimit} />
            <UsageBar label="Storage" used={usage.storageMbUsed} limit={usage.storageMbLimit} unit="MB" />
          </div>
        </div>
      )}

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              After cancellation, you won't be able to create new drafts or access premium features.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancelReason">Reason (optional)</Label>
            <Input
              id="cancelReason"
              placeholder="Tell us why you're cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

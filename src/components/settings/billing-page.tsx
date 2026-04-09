import { useState, useEffect } from 'react'
import { AlertTriangle, Info, ExternalLink, Download } from 'lucide-react'
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
import { usePlans } from '@/hooks/use-plans'
import { subscriptionApi } from '@/services/api/subscription-api'
import { cn } from '@/lib/utils'
import type { SubscriptionStatus, BillingCycle, PlanType, PaymentRecord } from '@/types'

const STATUS_BADGE_COLORS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  TRIALING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PAST_DUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CREATED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

const STATUS_DISPLAY_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  TRIALING: 'Trial',
  PAST_DUE: 'Past Due',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  PENDING: 'Pending',
  CREATED: 'Active',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
  /** e.g. "Resets weekly", "Plan limit" — shown as a subtle hint */
  period?: string
}

function UsageBar({ label, used, limit, unit, period }: UsageBarProps) {
  const safeUsed = used ?? 0
  const safeLimit = limit ?? 0
  const percent = getUsagePercent(safeUsed, safeLimit)
  const displayUsed =
    unit === 'MB' && safeUsed >= 1024
      ? `${(safeUsed / 1024).toFixed(1)} GB`
      : `${safeUsed}${unit ? ` ${unit}` : ''}`
  const displayLimit =
    safeLimit === -1
      ? 'Unlimited'
      : unit === 'MB' && safeLimit >= 1024
        ? `${(safeLimit / 1024).toFixed(0)} GB`
        : `${safeLimit}${unit ? ` ${unit}` : ''}`

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <div className="flex items-center gap-2">
          <span className="text-ledger-gray-600">{label}</span>
          {period && (
            <span className="text-[10px] text-ledger-gray-400 font-medium">{period}</span>
          )}
        </div>
        <span className="text-kx-primary-900 font-medium">
          {displayUsed} / {displayLimit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-ledger-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(percent))}
          style={{ width: `${safeLimit === -1 ? 0 : percent}%` }}
        />
      </div>
    </div>
  )
}


// Resolve the plan's type string regardless of which field the API uses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPlanTypeKey(plan: any): string {
  return (plan.type || plan.planType || plan.name || '').toUpperCase()
}

interface PlanSelectorProps {
  // planName as returned by the API (e.g. "FREE", "PRO", "PREMIUM")
  currentPlanName?: string
  currentBillingCycle?: BillingCycle
  onSuccess: () => void
}

function PlanSelector({ currentPlanName, currentBillingCycle, onSuccess }: PlanSelectorProps) {
  const { plans, isLoading, isSubscribing, subscribe } = usePlans()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(currentBillingCycle ?? 'MONTHLY')

  // Show only paid plans (skip FREE)
  const paidPlans = plans.filter((p) => getPlanTypeKey(p) !== 'FREE')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kx-primary-600" />
      </div>
    )
  }

  const handleSubscribe = async (plan: (typeof paidPlans)[0]) => {
    const planType = (plan.type || getPlanTypeKey(plan)) as PlanType
    const success = await subscribe(planType, billingCycle)
    if (success) onSuccess()
  }

  return (
    <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-kx-primary-900">Upgrade Plan</h3>

        {/* Billing cycle toggle */}
        <div className="flex items-center gap-1 bg-ledger-gray-100 dark:bg-white/10 rounded-full p-1">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              billingCycle === 'MONTHLY'
                ? 'bg-white dark:bg-kx-card shadow text-kx-primary-900'
                : 'text-ledger-gray-500 hover:text-kx-primary-700'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('YEARLY')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              billingCycle === 'YEARLY'
                ? 'bg-white dark:bg-kx-card shadow text-kx-primary-900'
                : 'text-ledger-gray-500 hover:text-kx-primary-700'
            )}
          >
            Yearly <span className="text-green-600">−17%</span>
          </button>
        </div>
      </div>

      {/* Plan cards — single row */}
      <div className="grid grid-cols-2 gap-3">
        {paidPlans.map((plan) => {
          const planKey = getPlanTypeKey(plan)
          const isCurrent = currentPlanName?.toUpperCase() === planKey
          const price = billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice

          return (
            <div
              key={plan.id}
              className={cn(
                'rounded-lg border p-4 flex flex-col gap-3',
                isCurrent
                  ? 'border-kx-primary-300 bg-kx-primary-50/40 dark:bg-kx-primary-900/10'
                  : 'border-kx-card-border'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ledger-gray-500">{plan.name}</p>
                  <p className="text-xl font-bold text-kx-primary-900 mt-0.5">
                    ₹{price.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-ledger-gray-500 ml-0.5">
                      /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                    </span>
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
                {plan.isPopular && !isCurrent && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-kx-primary-700 bg-kx-primary-100 dark:bg-kx-primary-900/30 px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant={isCurrent ? 'outline' : 'primary'}
                disabled={isCurrent || isSubscribing}
                onClick={() => handleSubscribe(plan)}
                className={cn('w-full', !isCurrent && 'bg-kx-primary-600 hover:bg-kx-primary-700 text-white')}
              >
                {isCurrent ? 'Current Plan' : isSubscribing ? 'Processing...' : 'Upgrade'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BillingPage() {
  const { subscription, usage, isLoading, refresh, cancelSubscription } = useSubscription()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    subscriptionApi.getPayments()
      .then(res => setPayments(res.data))
      .catch(() => { /* endpoint not yet live — silently ignore */ })
  }, [])

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true)
      const url = await subscriptionApi.getInvoiceUrl()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // endpoint not yet live
    } finally {
      setIsDownloading(false)
    }
  }

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
      <div className="max-w-2xl space-y-6">
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6 text-center">
          <Info className="h-8 w-8 text-ledger-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-kx-primary-900 mb-2">No active subscription</h3>
          <p className="text-sm text-ledger-gray-500 mb-4">Choose a plan to get started with Knowlex.</p>
        </div>
        <PlanSelector onSuccess={refresh} />
      </div>
    )
  }

  const isTrialing = subscription.status === 'TRIALING'
  const isFree = subscription.planName?.toUpperCase() === 'FREE'
  const canCancel = !isFree && (
    subscription.status === 'ACTIVE' ||
    subscription.status === 'TRIALING' ||
    subscription.status === 'CREATED'
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">Billing</h2>
      {/* Trial banner */}
      {isTrialing && subscription.trialEndDate && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Your free trial ends on{' '}
            <span className="font-semibold">{formatDate(subscription.trialEndDate)}</span>
          </p>
        </div>
      )}

      {/* Bento row: Plan card + Usage side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current plan card */}
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-kx-primary-900">
                {subscription.planDisplayName ?? subscription.planName}
              </h3>
              <span
                className={cn(
                  'inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                  STATUS_BADGE_COLORS[subscription.status]
                )}
              >
                {STATUS_DISPLAY_LABEL[subscription.status] ?? subscription.status}
              </span>
            </div>
            <span className="text-sm text-ledger-gray-500 capitalize">
              {subscription.billingCycle.toLowerCase()} billing
            </span>
          </div>

          {(subscription.currentPeriodStart || subscription.cancelledAt) && (
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              {subscription.currentPeriodStart && (
                <div>
                  <p className="text-ledger-gray-500">Current period</p>
                  <p className="text-kx-primary-900 font-medium">
                    {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd!)}
                  </p>
                </div>
              )}
              {subscription.cancelledAt && (
                <div>
                  <p className="text-ledger-gray-500">Cancelled on</p>
                  <p className="text-red-600 font-medium">{formatDate(subscription.cancelledAt)}</p>
                </div>
              )}
            </div>
          )}

          {/* Invoice + Cancel row */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-kx-card-border">
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className="flex items-center gap-1 text-xs text-kx-primary-600 hover:text-kx-primary-800 hover:underline transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloading ? 'Opening...' : 'View Invoice'}
            </button>
            {canCancel && (
              <button
                onClick={() => setShowCancelDialog(true)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Usage section */}
        {usage && (
          <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-kx-primary-900 mb-4">Usage</h3>
            <div className="space-y-4">
              <UsageBar label="Drafts" used={usage.draftsUsed} limit={usage.draftsLimit} period="Resets monthly" />
              <UsageBar label="Chat Messages" used={usage.chatMessagesUsed ?? 0} limit={usage.chatMessagesLimit ?? -1} period="Resets monthly" />
              <UsageBar label="Clients" used={usage.clientsUsed} limit={usage.clientsLimit} period="Plan limit" />
              <UsageBar label="Cases" used={usage.casesUsed} limit={usage.casesLimit} period="Plan limit" />
              <UsageBar
                label="Storage"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                used={usage.storageMbUsed ?? Math.round((usage as any).storageUsedBytes / (1024 * 1024))}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                limit={usage.storageMbLimit ?? Math.round((usage as any).storageLimitBytes / (1024 * 1024))}
                unit="MB"
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-kx-primary-900 mb-4">Payment History</h3>
          <div className="divide-y divide-kx-card-border">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-kx-primary-900">
                    {payment.currency} {(payment.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-ledger-gray-500 mt-0.5">{formatDate(payment.createdAt)}</p>
                </div>
                {payment.shortUrl && (
                  <a
                    href={payment.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-kx-primary-600 hover:text-kx-primary-800 hover:underline transition-colors"
                  >
                    View Receipt
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline plan selector — full width */}
      <PlanSelector
        currentPlanName={subscription.planName}
        currentBillingCycle={subscription.billingCycle}
        onSuccess={refresh}
      />

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until
              the end of your current billing period.
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

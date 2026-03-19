import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { usePlans } from '@/hooks/use-plans'
import { useSubscription } from '@/hooks/use-subscription'
import { cn } from '@/lib/utils'
import type { Plan, BillingCycle } from '@/types'

function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : String(value)
}

function formatStorage(mb: number): string {
  if (mb === -1) return 'Unlimited'
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`
  return `${mb} MB`
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

interface PlanCardProps {
  plan: Plan
  billingCycle: BillingCycle
  isCurrentPlan: boolean
  onSelect: () => void
  isSubscribing: boolean
}

function PlanCard({ plan, billingCycle, isCurrentPlan, onSelect, isSubscribing }: PlanCardProps) {
  const price = billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice
  const isEnterprise = plan.type === 'ENTERPRISE'

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-6 transition-shadow',
        plan.isPopular
          ? 'border-kx-primary-500 shadow-lg shadow-kx-primary-500/10'
          : 'border-kx-card-border shadow-sm',
        'bg-kx-card'
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-kx-primary-600 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-kx-primary-900">{plan.name}</h3>
        <p className="text-sm text-ledger-gray-500 mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        {isEnterprise ? (
          <div className="text-2xl font-bold text-kx-primary-900">Custom</div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-kx-primary-900">{formatPrice(price)}</span>
              <span className="text-sm text-ledger-gray-500">
                /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
              </span>
            </div>
            {billingCycle === 'YEARLY' && plan.monthlyPrice > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Save {formatPrice(plan.monthlyPrice * 12 - plan.yearlyPrice)}/year
              </p>
            )}
          </>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        <FeatureRow label="Drafts" value={formatLimit(plan.features.maxDrafts)} />
        <FeatureRow label="Clients" value={formatLimit(plan.features.maxClients)} />
        <FeatureRow label="Cases" value={formatLimit(plan.features.maxCases)} />
        <FeatureRow label="Storage" value={formatStorage(plan.features.maxStorageMb)} />
        {plan.features.payAsYouGoPrice > 0 && (
          <FeatureRow label="Pay-as-you-go" value={`${formatPrice(plan.features.payAsYouGoPrice)}/draft`} />
        )}
      </ul>

      {isCurrentPlan ? (
        <Button variant="outline" disabled className="w-full">
          Current Plan
        </Button>
      ) : isEnterprise ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open('mailto:support@knowlex.ai', '_blank')}
        >
          Contact Us
        </Button>
      ) : (
        <Button
          className="w-full"
          onClick={onSelect}
          disabled={isSubscribing}
        >
          {isSubscribing ? 'Processing...' : 'Start 7-day free trial'}
        </Button>
      )}
    </div>
  )
}

function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      <span className="text-ledger-gray-600">
        <span className="font-medium text-kx-primary-900">{value}</span> {label}
      </span>
    </li>
  )
}

export function PlanSelectionPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY')
  const { plans, isLoading, error, isSubscribing, subscribe } = usePlans()
  const { subscription } = useSubscription()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleSelect = async (plan: Plan) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/plans' } } })
      return
    }
    const success = await subscribe(plan.type, billingCycle)
    if (success) {
      navigate('/home')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kx-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kx-surface">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back link if authenticated */}
        {isAuthenticated && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-ledger-gray-500 hover:text-kx-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-kx-primary-900">
            Choose your plan
          </h1>
          <p className="text-ledger-gray-500 mt-2 text-sm md:text-base">
            Start with a 7-day free trial. No credit card required.
          </p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center gap-1 mt-6 rounded-lg bg-ledger-gray-100 dark:bg-white/5 p-1">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                billingCycle === 'MONTHLY'
                  ? 'bg-white dark:bg-kx-card text-kx-primary-900 shadow-sm'
                  : 'text-ledger-gray-500 hover:text-kx-primary-700'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                billingCycle === 'YEARLY'
                  ? 'bg-white dark:bg-kx-card text-kx-primary-900 shadow-sm'
                  : 'text-ledger-gray-500 hover:text-kx-primary-700'
              )}
            >
              Yearly
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isCurrentPlan={subscription?.planType === plan.type && (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING')}
              onSelect={() => handleSelect(plan)}
              isSubscribing={isSubscribing}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

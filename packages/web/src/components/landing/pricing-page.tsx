import React, { useState } from 'react'
import { Check, Building2, Minus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingHeader } from './landing-header'
import { LandingFooter } from './landing-footer'
import { useAuth } from '@/contexts/auth-context'
import { getAdapters } from '@knowlex/core/api/runtime'
import { inquiriesApi } from '@knowlex/core/api'
import { usePlans } from '@/hooks/use-plans'
import { cn } from '@/lib/utils'
import { goToDashboard } from '@/lib/hosts'
import type { PlanType, BillingCycle } from '@knowlex/core/types'

type BillingPeriod = 'monthly' | 'annual'

interface Plan {
  name: string
  planType: PlanType
  badge?: string
  monthly: string
  annual: string
  annualSavings: string
  description: string
  cta: string
  basePlan?: string
  payAsYouGo?: string
  features: string[]
  highlight: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    planType: 'FREE',
    monthly: '0',
    annual: '0',
    annualSavings: '',
    description: 'Try Knowlex with no commitment.',
    cta: 'Sign Up Free',
    highlight: false,
    features: [
      '5 clients · 10 cases',
      '100 MB storage',
      'Case Studio Chat (limited)',
      'Summary & synopsis (limited)',
      '5 AI drafts / month',
    ],
  },
  {
    name: 'Plus',
    planType: 'PLUS',
    monthly: '999',
    annual: '9,990',
    annualSavings: 'Save ₹1,998',
    description: 'Organised case management for individuals.',
    cta: 'Start 7 day free trial',
    highlight: false,
    basePlan: 'Free',
    payAsYouGo: '₹10 / extra draft',
    features: [
      '20 clients · 50 cases',
      '2 GB storage',
      'Legal Library — Supreme Court judgments & court data',
      'Document tools (split, merge, compress)',
      '25 AI drafts / month',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    planType: 'PRO',
    badge: 'Most Popular',
    monthly: '1,999',
    annual: '19,990',
    annualSavings: 'Save ₹3,998',
    description: 'The full toolkit for solo practitioners.',
    cta: 'Start 7 day free trial',
    highlight: true,
    basePlan: 'Plus',
    payAsYouGo: '₹10 / extra draft',
    features: [
      'Unlimited clients & cases',
      '5 GB storage',
      'Document translation',
      '100 AI drafts per month',
      'Case Studio Chat & summary',
      'Gemini & GPT models',
      'Priority support',
    ],
  },
  {
    name: 'Premium',
    planType: 'PREMIUM',
    monthly: '4,999',
    annual: '49,990',
    annualSavings: 'Save ₹9,998',
    description: 'Maximum power for growing practices.',
    cta: 'Start 7 day free trial',
    highlight: false,
    basePlan: 'Pro',
    payAsYouGo: '₹10 / extra draft',
    features: [
      '500 AI drafts per month',
      'AI research via Legal Library',
      'Gemini, GPT & Claude models',
      '10 GB storage',
    ],
  },
]

type CellValue = string | boolean | null

interface ComparisonRow {
  label: string
  free: CellValue
  plus: CellValue
  pro: CellValue
  premium: CellValue
}

interface ComparisonGroup {
  title: string
  rows: ComparisonRow[]
}

const comparisonGroups: ComparisonGroup[] = [
  {
    title: 'AI Drafting',
    rows: [
      { label: 'AI drafts per month', free: '5 (limited)', plus: '25', pro: '100', premium: '500' },
      { label: 'AI models', free: 'Gemini', plus: 'Gemini', pro: 'Gemini & GPT', premium: 'Gemini, GPT & Claude' },
    ],
  },
  {
    title: 'AI Tools',
    rows: [
      { label: 'Case Studio Chat', free: 'Limited', plus: 'Limited', pro: true, premium: true },
      { label: 'Summary & synopsis', free: 'Limited', plus: 'Limited', pro: true, premium: true },
      { label: 'Document translation', free: false, plus: false, pro: true, premium: true },
    ],
  },
  {
    title: 'Legal Library',
    rows: [
      { label: 'Supreme Court judgments & court data', free: false, plus: true, pro: true, premium: true },
      { label: 'AI research on Legal Library', free: false, plus: false, pro: false, premium: true },
    ],
  },
  {
    title: 'Case & Client Management',
    rows: [
      { label: 'Clients', free: '5', plus: '20', pro: 'Unlimited', premium: 'Unlimited' },
      { label: 'Cases', free: '10', plus: '50', pro: 'Unlimited', premium: 'Unlimited' },
      { label: 'Document storage', free: '100 MB', plus: '2 GB', pro: '5 GB', premium: '10 GB' },
      { label: 'Document upload & search', free: true, plus: true, pro: true, premium: true },
      { label: 'Document tools (split, merge, compress)', free: false, plus: true, pro: true, premium: true },
    ],
  },
  {
    title: 'Support',
    rows: [
      { label: 'Email support', free: false, plus: true, pro: true, premium: true },
      { label: 'Priority support', free: false, plus: false, pro: true, premium: true },
    ],
  },
]

function Cell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="w-4 h-4 text-kx-primary-500 mx-auto" />
  if (value === false) return <Minus className="w-4 h-4 text-gray-300 mx-auto" />
  if (value === null) return <X className="w-4 h-4 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-700 text-center block">{value}</span>
}

function FeatureComparison() {
  return (
    <div className="mt-16 mb-8">
      <h2 className="text-2xl font-serif font-semibold text-gray-900 text-center mb-8">Compare plans</h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-sm font-medium text-gray-500 w-[40%]">Feature</th>
              {['Free', 'Plus', 'Pro', 'Premium'].map((name) => (
                <th key={name} className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900 w-[15%]">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonGroups.map((group) => (
              <React.Fragment key={group.title}>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <td colSpan={5} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={cn(
                      'border-b border-gray-100',
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    )}
                  >
                    <td className="px-5 py-3 text-sm text-gray-600">{row.label}</td>
                    <td className="px-4 py-3"><Cell value={row.free} /></td>
                    <td className="px-4 py-3"><Cell value={row.plus} /></td>
                    <td className="px-4 py-3"><Cell value={row.pro} /></td>
                    <td className="px-4 py-3"><Cell value={row.premium} /></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EnterpriseInlineForm() {
  const [form, setForm] = useState({ name: '', email: '', org: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await inquiriesApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        organization: form.org.trim(),
      })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center min-w-[260px] py-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-5 h-5 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-kx-text-primary">Thanks — we'll be in touch soon.</p>
        <p className="text-xs text-kx-text-secondary max-w-[240px]">We typically respond within one business day.</p>
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 text-sm bg-white border border-kx-primary-200/70 rounded-xl text-kx-text-primary placeholder-ledger-gray-400 focus:outline-none focus:ring-2 focus:ring-kx-primary-300/60 focus:border-kx-primary-400 transition disabled:opacity-60'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 min-w-[260px] w-full md:w-auto">
      <input
        required
        type="text"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="Your name"
        className={inputCls}
        disabled={submitting}
      />
      <input
        required
        type="email"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        placeholder="Work email"
        className={inputCls}
        disabled={submitting}
      />
      <input
        required
        type="text"
        value={form.org}
        onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
        placeholder="Firm / Organisation"
        className={inputCls}
        disabled={submitting}
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-kx-primary-800 text-white font-semibold text-sm px-4 py-3 rounded-xl hover:bg-kx-primary-900 transition-colors shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Sending…' : 'Get in touch'}
      </button>
      {error && (
        <p className="text-xs text-rose-600 text-center mt-1">{error}</p>
      )}
    </form>
  )
}

export function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const { isAuthenticated } = useAuth()
  const { subscribe, isSubscribing } = usePlans()

  const handleSubscribe = async (plan: Plan) => {
    if (plan.planType === 'FREE') {
      goToDashboard('/signup')
      return
    }
    if (!getAdapters().env.enablePayment) {
      goToDashboard('/login')
      return
    }
    if (!isAuthenticated) {
      goToDashboard('/signup')
      return
    }
    const billingCycle: BillingCycle = billing === 'monthly' ? 'MONTHLY' : 'YEARLY'
    const success = await subscribe(plan.planType, billingCycle)
    if (success) goToDashboard('/home')
  }

  return (
    <div className="min-h-screen bg-white force-light flex flex-col">
      <LandingHeader onSignIn={() => goToDashboard('/login')} />

      <main className="flex-1">
        {/* Header */}
        <div className="text-center pt-16 pb-10 px-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-kx-primary-500 mb-3">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-serif font-semibold text-gray-900 mb-4">
            Plans for every practice
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            For individual lawyers, boutique firms, and large practices alike.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center mt-8 rounded-full border border-gray-200 p-1 bg-gray-50 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-colors',
                billing === 'monthly'
                  ? 'bg-kx-primary-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2',
                billing === 'annual'
                  ? 'bg-kx-primary-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              Annual
              <span className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                billing === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
              )}>
                2 months free
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
            {plans.map((plan) => {
              const isPaid = plan.planType !== 'FREE'
              const price = billing === 'monthly' ? plan.monthly : plan.annual

              return (
                <div
                  key={plan.name}
                  className={cn(
                    'relative rounded-2xl border flex flex-col p-6 transition-shadow',
                    plan.highlight
                      ? 'border-gray-900 shadow-xl shadow-gray-200/80 bg-white'
                      : 'border-gray-200 bg-white hover:shadow-md'
                  )}
                >
                  {/* Most Popular badge — centered, just above card border */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-kx-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-xl font-serif font-semibold text-gray-900">{plan.name}</h2>
                      {billing === 'annual' && plan.annualSavings && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {plan.annualSavings}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 leading-snug">{plan.description}</p>
                  </div>

                  <div className="mb-5">
                    {isPaid ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">₹{price}</span>
                        <span className="text-sm text-gray-400">/{billing === 'monthly' ? 'mo' : 'yr'} + GST</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">Free</span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isPaid && getAdapters().env.enablePayment && isSubscribing}
                    variant={plan.planType === 'FREE' ? 'outline' : 'primary'}
                    className={cn(
                      'w-full mb-6',
                      plan.planType === 'FREE'
                        ? 'border-kx-primary-300 text-kx-primary-600 hover:bg-kx-primary-50'
                        : 'bg-kx-primary-600 hover:bg-kx-primary-700 text-white'
                    )}
                  >
                    {isPaid && getAdapters().env.enablePayment && isSubscribing ? 'Processing...' : plan.cta}
                  </Button>

                  <div className="flex-1 flex flex-col">
                    {plan.basePlan && (
                      <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                        <span className="inline-block w-3 h-px bg-gray-400" />
                        Includes everything in {plan.basePlan}
                      </p>
                    )}
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className={cn('w-4 h-4 flex-shrink-0 mt-0.5', plan.highlight ? 'text-gray-900' : 'text-kx-primary-500')} />
                          <span className="text-sm text-gray-600 leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.payAsYouGo && (
                      <p className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="font-medium text-gray-500">{plan.payAsYouGo}</span>
                        after monthly limit
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Enterprise band */}
          <div className="mt-8 rounded-2xl bg-kx-primary-50 border border-kx-primary-100 p-8 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-10 md:gap-14 items-center">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-kx-primary-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-serif font-semibold text-kx-text-primary">Enterprise & Law Firms</h3>
              </div>
              <p className="text-sm text-kx-text-secondary leading-relaxed max-w-lg">
                Custom limits, dedicated onboarding, SSO, and a plan built around your firm's volume and workflow.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-5 max-w-md">
                {['Unlimited everything', 'Dedicated support', 'Custom integrations', 'Volume pricing'].map(f => (
                  <span key={f} className="flex items-center gap-2 text-sm text-kx-text-primary">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-kx-text-primary mb-3">Talk to us</p>
              <EnterpriseInlineForm />
            </div>
          </div>

          <FeatureComparison />

          {/* GST note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            All prices in INR · GST applicable · Cancel anytime
          </p>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}

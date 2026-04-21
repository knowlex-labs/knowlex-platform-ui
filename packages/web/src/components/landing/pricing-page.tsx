import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Building2, X, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingHeader } from './landing-header'
import { LandingFooter } from './landing-footer'
import { useAuth } from '@/contexts/auth-context'
import { getAdapters } from '@knowlex/core/api/runtime'
import { usePlans } from '@/hooks/use-plans'
import { cn } from '@/lib/utils'
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

interface EnterpriseDialogProps {
  open: boolean
  onClose: () => void
}

function EnterpriseDialog({ open, onClose }: EnterpriseDialogProps) {
  const [form, setForm] = useState({ name: '', email: '', org: '', size: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Enterprise Inquiry — ${form.org}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nOrganization: ${form.org}\nTeam size: ${form.size || 'Not specified'}\n\n${form.message}`
    )
    window.location.href = `mailto:nakul.jain@getknowlex.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-gray-900 mb-2">Opening your email</h3>
            <p className="text-gray-500 text-sm">
              Your email client should open with the details pre-filled. We'll get back to you within 24 hours.
            </p>
            <button onClick={onClose} className="mt-6 text-sm text-kx-primary-600 hover:underline">
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-1">Contact Sales</h3>
            <p className="text-sm text-gray-500 mb-6">Tell us about your firm and we'll reach out within 24 hours.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Your name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kx-primary-300 focus:border-transparent"
                    placeholder="Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Work email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kx-primary-300 focus:border-transparent"
                    placeholder="rahul@firm.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Firm / Organisation *</label>
                  <input
                    required
                    type="text"
                    value={form.org}
                    onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kx-primary-300 focus:border-transparent"
                    placeholder="Sharma & Associates"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Team size</label>
                  <select
                    value={form.size}
                    onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kx-primary-300 focus:border-transparent text-gray-700"
                  >
                    <option value="">Select</option>
                    <option value="2–5">2–5 lawyers</option>
                    <option value="6–15">6–15 lawyers</option>
                    <option value="16–50">16–50 lawyers</option>
                    <option value="50+">50+ lawyers</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">What are you looking for?</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kx-primary-300 focus:border-transparent resize-none"
                  placeholder="Tell us about your needs — team size, document volumes, specific features..."
                />
              </div>

              <Button type="submit" className="w-full bg-kx-primary-600 hover:bg-kx-primary-700 text-white">
                Send Enquiry
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [enterpriseOpen, setEnterpriseOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { subscribe, isSubscribing } = usePlans()
  const navigate = useNavigate()

  const handleSubscribe = async (plan: Plan) => {
    if (plan.planType === 'FREE') {
      navigate('/signup')
      return
    }
    if (!getAdapters().env.enablePayment) {
      navigate('/login')
      return
    }
    if (!isAuthenticated) {
      navigate('/signup', { state: { from: { pathname: '/pricing' } } })
      return
    }
    const billingCycle: BillingCycle = billing === 'monthly' ? 'MONTHLY' : 'YEARLY'
    const success = await subscribe(plan.planType, billingCycle)
    if (success) navigate('/home')
  }

  return (
    <div className="min-h-screen bg-white force-light flex flex-col">
      <LandingHeader onSignIn={() => navigate('/login')} />

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
          <div className="mt-8 rounded-2xl bg-gray-900 px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold text-white mb-1">Enterprise & Law Firms</h3>
                <p className="text-sm text-gray-400 max-w-lg">
                  Custom limits, dedicated onboarding, SSO, and a plan built around your firm's volume and workflow.
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  {['Unlimited everything', 'Dedicated support', 'Custom integrations', 'Volume pricing'].map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs text-gray-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEnterpriseOpen(true)}
              className="flex-shrink-0 bg-white text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Contact Sales
            </button>
          </div>

          <FeatureComparison />

          {/* GST note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            All prices in INR · GST applicable · Cancel anytime
          </p>
        </div>
      </main>

      <LandingFooter />
      <EnterpriseDialog open={enterpriseOpen} onClose={() => setEnterpriseOpen(false)} />
    </div>
  )
}

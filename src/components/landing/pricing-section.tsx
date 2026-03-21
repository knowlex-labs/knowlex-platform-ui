import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Check, Sparkles } from 'lucide-react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { useAuth } from '@/contexts/auth-context'
import { config } from '@/config/env'
import { usePlans } from '@/hooks/use-plans'
import type { PlanType, BillingCycle } from '@/types'

type BillingPeriod = 'monthly' | 'annual'

interface Plan {
  name: string
  planType: PlanType
  monthly: { price: string; period: string }
  annual: { price: string; period: string; savings: string }
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

const plans: Plan[] = [
  {
    name: 'Basic',
    planType: 'FREE',
    monthly: { price: '0', period: '/month' },
    annual: { price: '0', period: '/year', savings: '' },
    description: 'Get started with drafting and client management.',
    features: [
      'Draft up to 5 documents a month',
      'Manage 5 clients and 20 cases',
      'Ask the AI — limited queries',
      'Store up to 100 MB of documents',
    ],
    cta: 'Sign Up Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    planType: 'PRO',
    monthly: { price: '1,499', period: '/month' },
    annual: { price: '14,990', period: '/year', savings: 'Save ₹2,998/year' },
    description: 'For solo practitioners getting started.',
    features: [
      '100 AI-powered drafts per month',
      '₹10 per additional draft',
      'Manage 20 clients and 40 cases',
      'More AI — ask more, draft faster',
      'Access to Gemini & GPT models',
      'Upload and search your documents',
      '2 GB document storage',
      'Email support',
    ],
    cta: 'Start 7-Day Free Trial',
    highlighted: false,
  },
  {
    name: 'Premium',
    planType: 'PREMIUM',
    monthly: { price: '4,999', period: '/month' },
    annual: { price: '49,990', period: '/year', savings: 'Save ₹9,998/year' },
    description: 'For growing practices that need more power.',
    features: [
      '500 AI-powered drafts per month',
      '₹10 per additional draft',
      'Unlimited clients and cases',
      '3× more AI usage than Pro',
      'Access to Gemini, GPT & Claude — including latest models',
      'Full AI legal research and analysis',
      'Upload, search and cite documents',
      '10 GB document storage',
      'Priority support',
    ],
    cta: 'Start 7-Day Free Trial',
    highlighted: true,
  },
]

export function PricingSection() {
  const { ref, isVisible } = useScrollReveal()
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const { isAuthenticated } = useAuth()
  const { subscribe, isSubscribing } = usePlans()
  const navigate = useNavigate()

  const handleSubscribe = async (plan: Plan) => {
    if (plan.planType === 'FREE') {
      navigate('/signup')
      return
    }
    if (!config.enablePayment) {
      // Payments disabled: let users start the trial flow via login (no signup).
      navigate('/login')
      return
    }
    if (!isAuthenticated) {
      navigate('/signup', { state: { from: { pathname: '/', hash: '#pricing' } } })
      return
    }
    const billingCycle: BillingCycle = billing === 'monthly' ? 'MONTHLY' : 'YEARLY'
    const success = await subscribe(plan.planType, billingCycle)
    if (success) {
      navigate('/home')
    }
  }

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-3 sm:mb-4">
            Pricing
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary max-w-2xl mx-auto mb-6 sm:mb-8">
            Choose the plan that fits your practice.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center rounded-full border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billing === 'monthly'
                  ? 'bg-[#7a2e2e] text-white shadow-sm'
                  : 'text-kx-text-secondary hover:text-kx-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                billing === 'annual'
                  ? 'bg-[#7a2e2e] text-white shadow-sm'
                  : 'text-kx-text-secondary hover:text-kx-text-primary'
              }`}
            >
              Annual
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                billing === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                2 months free
              </span>
            </button>
          </div>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 scroll-reveal-stagger items-stretch"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`scroll-reveal bg-white rounded-2xl p-5 sm:p-6 md:p-8 border flex flex-col relative ${isVisible ? 'is-visible' : ''} ${
                'border-gray-200'
              }`}
            >
              {billing === 'annual' && plan.annual?.savings && (
                <div className="flex items-center gap-1.5 mb-3 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  {plan.annual.savings}
                </div>
              )}

              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary mb-2">
                {plan.name}
              </h3>

              <p className="text-sm sm:text-base text-kx-text-secondary mb-4 sm:mb-6">
                {plan.description}
              </p>

              <div className="mb-4 sm:mb-6">
                <div>
                  <span className="text-2xl sm:text-3xl font-sans font-semibold text-kx-text-primary">
                    {plan.planType === 'FREE' ? 'Free' : `₹${billing === 'monthly' ? plan.monthly.price : plan.annual.price}`}
                  </span>
                  {plan.planType !== 'FREE' && (
                    <span className="text-sm sm:text-base text-kx-text-secondary">
                      {billing === 'monthly' ? plan.monthly.period : plan.annual.period} + GST
                    </span>
                  )}
                </div>
              </div>

              <Button
                className={`w-full mb-6 sm:mb-8 ${
                  plan.planType === 'FREE'
                    ? 'border-[#7a2e2e] text-[#7a2e2e] hover:bg-red-50 bg-transparent'
                    : 'bg-[#7a2e2e] text-white hover:bg-[#5e2323]'
                }`}
                variant={plan.planType === 'FREE' ? 'outline' : 'primary'}
                disabled={config.enablePayment && plan.planType !== 'FREE' && isSubscribing}
                onClick={() => handleSubscribe(plan)}
              >
                {config.enablePayment && plan.planType !== 'FREE' && isSubscribing
                  ? 'Processing...'
                  : plan.cta}
              </Button>

              <ul className="space-y-2 sm:space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#7a2e2e] flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-kx-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

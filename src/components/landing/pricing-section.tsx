import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface PricingSectionProps {
  onGetStarted: () => void
}

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for solo practitioners getting started.',
    features: [
      'Up to 10 clients',
      'Basic case management',
      'Email support',
      'Mobile access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '1,499',
    period: '/month',
    description: 'For growing practices that need more power.',
    features: [
      'Unlimited clients',
      'Advanced case timelines',
      'AI-assisted drafting',
      'Billing & invoicing',
      'Priority support',
      'Team collaboration',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Custom',
    price: 'Custom',
    description: 'For law firms with specific requirements.',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'On-premise deployment',
      'SLA guarantees',
      'Training & onboarding',
    ],
    cta: 'Contact Us',
    highlighted: false,
  },
]

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const handleContactUs = () => {
    window.location.href = 'mailto:contact@knowlex.in?subject=Custom Plan Inquiry'
  }

  return (
    <section id="pricing" className="py-16 md:py-24 bg-ledger-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-ledger-black mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-ledger-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your practice. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-ledger-white rounded-lg p-6 md:p-8 border ${
                plan.highlighted
                  ? 'border-ledger-black ring-2 ring-ledger-black'
                  : 'border-ledger-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-medium text-ledger-white bg-ledger-black px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-serif font-semibold text-ledger-black mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                {plan.price === 'Custom' ? (
                  <span className="text-3xl font-serif font-semibold text-ledger-black">
                    Custom
                  </span>
                ) : (
                  <>
                    <span className="text-sm text-ledger-gray-500">₹</span>
                    <span className="text-3xl font-serif font-semibold text-ledger-black">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-ledger-gray-500">{plan.period}</span>
                    )}
                  </>
                )}
              </div>
              <p className="text-ledger-gray-600 mb-6">
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-ledger-black flex-shrink-0 mt-0.5" />
                    <span className="text-ledger-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? 'primary' : 'outline'}
                className="w-full"
                onClick={plan.name === 'Custom' ? handleContactUs : onGetStarted}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

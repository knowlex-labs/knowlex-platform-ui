import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface PricingSectionProps {
  onGetStarted: () => void
}

const plans = [
  {
    name: 'Basic',
    price: 'Free',
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
    period: '/mo',
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
    name: 'Enterprise',
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
    window.location.href = 'mailto:nakul.jain@getknowlex.com?subject=Enterprise Plan Inquiry'
  }

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-24 bg-ledger-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-ledger-black mb-3 sm:mb-4">
            Pricing
          </h2>
          <p className="text-base sm:text-lg text-ledger-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-ledger-white rounded-lg p-5 sm:p-6 md:p-8 border flex flex-col ${
                plan.highlighted
                  ? 'border-ledger-black ring-2 ring-ledger-black'
                  : 'border-ledger-gray-200'
              }`}
            >
              {/* Plan Name */}
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-ledger-black mb-2">
                {plan.name}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-ledger-gray-600 mb-4 sm:mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-4 sm:mb-6">
                {plan.price === 'Custom' ? (
                  <span className="text-2xl sm:text-3xl font-serif font-semibold text-ledger-black">
                    Custom
                  </span>
                ) : plan.price === 'Free' ? (
                  <span className="text-2xl sm:text-3xl font-serif font-semibold text-ledger-black">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl font-sans font-semibold text-ledger-black">₹{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm sm:text-base text-ledger-gray-500">{plan.period}</span>
                    )}
                  </>
                )}
              </div>

              {/* CTA Button */}
              <Button
                variant={plan.highlighted ? 'primary' : 'outline'}
                className="w-full mb-6 sm:mb-8"
                onClick={plan.name === 'Enterprise' ? handleContactUs : onGetStarted}
              >
                {plan.cta}
              </Button>

              {/* Features */}
              <ul className="space-y-2 sm:space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-ledger-black flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-ledger-gray-600">{feature}</span>
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

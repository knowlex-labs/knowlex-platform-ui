import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

const CALENDLY_URL = 'https://calendly.com/nakul-jain-getknowlex/30min'

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
    cta: 'Book a Demo',
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
    cta: 'Book a Demo',
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

export function PricingSection() {
  const { ref, isVisible } = useScrollReveal()

  const handleContactUs = () => {
    window.location.href = 'mailto:nakul.jain@getknowlex.com?subject=Enterprise Plan Inquiry'
  }

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-3 sm:mb-4">
            Pricing
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary max-w-2xl mx-auto">
            Choose the plan that fits your practice.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 scroll-reveal-stagger"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`scroll-reveal bg-white rounded-2xl p-5 sm:p-6 md:p-8 border flex flex-col ${isVisible ? 'is-visible' : ''} ${
                plan.highlighted
                  ? 'border-[#7a2e2e] ring-2 ring-[#7a2e2e]'
                  : 'border-gray-200'
              }`}
            >
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary mb-2">
                {plan.name}
              </h3>

              <p className="text-sm sm:text-base text-kx-text-secondary mb-4 sm:mb-6">
                {plan.description}
              </p>

              <div className="mb-4 sm:mb-6">
                {plan.price === 'Custom' ? (
                  <span className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary">
                    Custom
                  </span>
                ) : plan.price === 'Free' ? (
                  <span className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl font-sans font-semibold text-kx-text-primary">₹{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm sm:text-base text-kx-text-secondary">{plan.period}</span>
                    )}
                  </>
                )}
              </div>

              <Button
                className={`w-full mb-6 sm:mb-8 ${
                  plan.highlighted
                    ? 'bg-[#7a2e2e] text-white hover:bg-[#5e2323]'
                    : 'border-[#7a2e2e] text-[#7a2e2e] hover:bg-red-50 bg-transparent'
                }`}
                variant={plan.highlighted ? 'primary' : 'outline'}
                onClick={plan.name === 'Enterprise' ? handleContactUs : () => window.open(CALENDLY_URL, '_blank')}
              >
                {plan.cta}
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

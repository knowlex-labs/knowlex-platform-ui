import { Briefcase, FileText, Search, Database } from 'lucide-react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

const steps = [
  {
    number: 1,
    icon: Briefcase,
    title: 'Create Your Case',
    description:
      'Add a new case to set up your workspace — all drafts, research, and documents organized in one place.',
    highlight: 'Your workspace',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-800',
  },
  {
    number: 2,
    icon: FileText,
    title: 'Draft & Edit Documents',
    description:
      'Generate drafts from predefined legal templates, edit them yourself, or refine with AI. Upload supporting documents right alongside.',
    highlight: 'AI-assisted',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
  },
  {
    number: 3,
    icon: Search,
    title: 'Research with Real Judgements',
    description:
      'Ask questions about any case and get answers grounded in Indian Supreme Court and High Court decisions from our knowledge base.',
    highlight: 'Cited answers',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
]

export function HowItWorksSection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-3 sm:mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary max-w-2xl mx-auto">
            From case creation to court-ready output — in three simple steps.
          </p>
        </div>

        <div
          ref={ref}
          className={`scroll-reveal-stagger relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 mb-12 sm:mb-16`}
        >
          {/* Connector lines — desktop only */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-red-200 via-orange-200 to-amber-200" />

          {steps.map((step) => (
            <div
              key={step.number}
              className={`scroll-reveal relative flex flex-col items-center text-center ${isVisible ? 'is-visible' : ''}`}
            >
              {/* Step badge */}
              <span className="inline-flex items-center justify-center text-xs font-bold text-kx-text-secondary bg-white border border-gray-200 rounded-full px-3 py-1 mb-4 shadow-sm">
                Step {step.number}
              </span>

              {/* Icon */}
              <div
                className={`relative z-10 w-14 h-14 rounded-full ${step.iconBg} flex items-center justify-center mb-5 shadow-sm`}
              >
                <step.icon className={`w-6 h-6 ${step.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-kx-text-primary mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-kx-text-secondary leading-relaxed mb-3 max-w-xs">
                {step.description}
              </p>

              {/* Highlight chip */}
              <span
                className={`inline-flex items-center text-xs font-medium ${step.iconColor} ${step.iconBg} rounded-full px-3 py-1`}
              >
                {step.highlight}
              </span>
            </div>
          ))}
        </div>

        {/* Differentiator callout */}
        <div
          className={`scroll-reveal ${isVisible ? 'is-visible' : ''} bg-[#2d1518] rounded-2xl p-8 sm:p-10 text-center`}
          style={{ transitionDelay: '360ms' }}
        >
          <Database className="w-8 h-8 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-serif font-semibold text-white mb-2">
            The only platform built on a curated Indian judgements database
          </h3>
          <p className="text-sm sm:text-base text-white/60 max-w-lg mx-auto">
            Every research query and drafted document is grounded in 50,000+
            real Supreme Court and High Court decisions — not generic AI
            outputs.
          </p>
        </div>
      </div>
    </section>
  )
}

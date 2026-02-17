import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface FeatureShowcaseProps {
  title: string
  description: string
  bullets: string[]
  icon: LucideIcon
  iconBg: string
  iconColor: string
  mockup: ReactNode
  reversed?: boolean
}

export function FeatureShowcase({
  title,
  description,
  bullets,
  icon: Icon,
  iconBg,
  iconColor,
  mockup,
  reversed = false,
}: FeatureShowcaseProps) {
  const textReveal = useScrollReveal({ threshold: 0.15 })
  const mockupReveal = useScrollReveal({ threshold: 0.15 })

  const slideClass = reversed ? 'slide-in-left' : 'slide-in-right'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      {/* Text side */}
      <div
        ref={textReveal.ref}
        className={`scroll-reveal ${textReveal.isVisible ? 'is-visible' : ''} ${reversed ? 'lg:order-2' : ''}`}
      >
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg} mb-5`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary mb-4">
          {title}
        </h3>
        <p className="text-base text-kx-text-secondary mb-6 leading-relaxed">
          {description}
        </p>
        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm text-kx-text-secondary">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-kx-primary-500 shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup side */}
      <div
        ref={mockupReveal.ref}
        className={`${slideClass} ${mockupReveal.isVisible ? 'is-visible' : ''} ${reversed ? 'lg:order-1' : ''}`}
      >
        <div className="rounded-xl shadow-lg border border-ledger-gray-200/60 bg-ledger-white overflow-hidden h-[260px] sm:h-[300px]">
          {mockup}
        </div>
      </div>
    </div>
  )
}

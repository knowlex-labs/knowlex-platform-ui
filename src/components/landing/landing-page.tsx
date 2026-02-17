import { LandingHeader } from './landing-header'
import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { PricingSection } from './pricing-section'
import { AboutSection } from './about-section'
import { FAQSection } from './faq-section'
import { CTASection } from './cta-section'
import { LandingFooter } from './landing-footer'

interface LandingPageProps {
  onSignIn: () => void
}

export function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white force-light">
      <LandingHeader onSignIn={onSignIn} />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <AboutSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

import { LandingHeader } from './landing-header'
import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { StatsSection } from './stats-section'
import { PricingSection } from './pricing-section'
import { AboutSection } from './about-section'
import { FAQSection } from './faq-section'
import { CTASection } from './cta-section'
import { LandingFooter } from './landing-footer'

interface LandingPageProps {
  onSignIn: () => void
  onContinueAsGuest: () => void
}

export function LandingPage({ onSignIn, onContinueAsGuest }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white force-light">
      <LandingHeader onSignIn={onSignIn} />
      <HeroSection onGetStarted={onSignIn} onContinueAsGuest={onContinueAsGuest} />
      <FeaturesSection />
      <StatsSection />
      <PricingSection onGetStarted={onSignIn} />
      <AboutSection />
      <FAQSection />
      <CTASection onGetStarted={onSignIn} onContinueAsGuest={onContinueAsGuest} />
      <LandingFooter />
    </div>
  )
}

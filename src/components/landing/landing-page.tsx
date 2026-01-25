import { LandingHeader } from './landing-header'
import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { PricingSection } from './pricing-section'
import { TeamSection } from './team-section'
import { AboutSection } from './about-section'
import { CTASection } from './cta-section'
import { LandingFooter } from './landing-footer'

interface LandingPageProps {
  onSignIn: () => void
  onContinueAsGuest: () => void
}

export function LandingPage({ onSignIn, onContinueAsGuest }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-ledger-white">
      <LandingHeader onSignIn={onSignIn} />
      <HeroSection onGetStarted={onSignIn} onContinueAsGuest={onContinueAsGuest} />
      <FeaturesSection />
      <PricingSection onGetStarted={onSignIn} />
      <TeamSection />
      <AboutSection />
      <CTASection onGetStarted={onSignIn} onContinueAsGuest={onContinueAsGuest} />
      <LandingFooter />
    </div>
  )
}

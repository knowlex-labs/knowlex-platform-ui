import { LandingHeader } from './landing-header'
import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { TemplatesMarquee } from './templates-marquee'
import { AboutSection } from './about-section'
import { TeamSection } from './team-section'
import { PricingSection } from './pricing-section'
import { FAQSection } from './faq-section'
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
      <TemplatesMarquee />
      <AboutSection />
      <TeamSection />
      <PricingSection />
      <FAQSection />
      <LandingFooter />
    </div>
  )
}

import { LandingHeader } from './landing-header'
import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { TeamSection } from './team-section'
import { AboutSection } from './about-section'
import { LandingFooter } from './landing-footer'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <TeamSection />
      <AboutSection />
      <LandingFooter />
    </div>
  )
}

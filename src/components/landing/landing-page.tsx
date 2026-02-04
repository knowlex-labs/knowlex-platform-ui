import { LandingHeader } from './landing-header'
import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { TeamSection } from './team-section'
import { AboutSection } from './about-section'

export function LandingPage() {
  return (
    <div className="relative min-h-screen font-serif">
      {/* Global Background Texture */}
      <div
        className="fixed inset-0 z-0 bg-[url('/bg_fill.png')] bg-repeat opacity-100"
        style={{ backgroundSize: 'auto' }}
      />

      {/* Content Container */}
      <div className="relative z-10">
        <LandingHeader />
        <HeroSection />
        <FeaturesSection />
        <TeamSection />
        <AboutSection />
      </div>
    </div>
  )
}

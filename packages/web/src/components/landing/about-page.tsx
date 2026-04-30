import { LandingHeader } from './landing-header'
import { LandingFooter } from './landing-footer'
import { AboutSection } from './about-section'
import { TeamSection } from './team-section'
import { goToDashboard } from '@/lib/hosts'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white force-light flex flex-col">
      <LandingHeader onSignIn={() => goToDashboard('/login')} />
      <main className="flex-1">
        <AboutSection />
        <TeamSection />
      </main>
      <LandingFooter />
    </div>
  )
}

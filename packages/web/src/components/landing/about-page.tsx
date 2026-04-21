import { useNavigate } from 'react-router-dom'
import { LandingHeader } from './landing-header'
import { LandingFooter } from './landing-footer'
import { AboutSection } from './about-section'
import { TeamSection } from './team-section'

export function AboutPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white force-light flex flex-col">
      <LandingHeader onSignIn={() => navigate('/login')} />
      <main className="flex-1">
        <AboutSection />
        <TeamSection />
      </main>
      <LandingFooter />
    </div>
  )
}

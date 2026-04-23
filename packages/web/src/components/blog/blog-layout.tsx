import { Outlet } from 'react-router-dom'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'
import { goToDashboard } from '@/lib/hosts'

export function BlogLayout() {
  return (
    <div className="force-light min-h-screen bg-white">
      <LandingHeader onSignIn={() => goToDashboard('/login')} />
      <main>
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}

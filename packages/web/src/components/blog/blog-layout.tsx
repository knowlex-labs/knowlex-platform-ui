import { Outlet, useNavigate } from 'react-router-dom'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'

export function BlogLayout() {
  const navigate = useNavigate()
  return (
    <div className="force-light min-h-screen bg-white">
      <LandingHeader onSignIn={() => navigate('/login')} />
      <main>
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}

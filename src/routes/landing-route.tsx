import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { LandingPage } from '@/components/landing/landing-page'
import { useToast } from '@/hooks/use-toast'

export function LandingRoute() {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Redirect authenticated users to home
  React.useEffect(() => {
    if (isAuthenticated && !isRestoringSession) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, isRestoringSession, navigate])

  // Listen for toast events
  React.useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      toast(customEvent.detail)
    }

    window.addEventListener('toast:show', handleToastEvent)
    return () => window.removeEventListener('toast:show', handleToastEvent)
  }, [toast])

  // Handle session expiry — redirect to login page
  React.useEffect(() => {
    const handleSessionExpired = () => {
      navigate('/login', { state: { sessionExpired: true } })
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [navigate])

  const handleSignIn = () => {
    navigate('/login')
  }

  // Show loading while restoring session
  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kx-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600 mx-auto mb-4"></div>
          <p className="text-kx-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <LandingPage onSignIn={handleSignIn} />
  )
}

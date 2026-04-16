import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/hooks/use-subscription'
import { LandingPage } from '@/components/landing/landing-page'
import { useToast } from '@/hooks/use-toast'
import { getAdapters } from '@knowlex/core/api/runtime'

export function LandingRoute() {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const { subscription, isLoading: isLoadingSubscription } = useSubscription()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Redirect authenticated users to home
  // When payment is enabled, only redirect if they have an active subscription
  React.useEffect(() => {
    if (!isAuthenticated || isRestoringSession) return

    if (getAdapters().env.enablePayment) {
      if (!isLoadingSubscription) {
        const hasActiveSubscription =
          subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'
        if (hasActiveSubscription) {
          navigate('/home', { replace: true })
        }
      }
    } else {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, isRestoringSession, isLoadingSubscription, subscription, navigate])

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

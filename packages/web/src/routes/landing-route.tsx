import * as React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/hooks/use-subscription'
import { LandingPage } from '@/components/landing/landing-page'
import { useToast } from '@/hooks/use-toast'
import { getAdapters } from '@knowlex/core/api/runtime'
import { goToDashboard } from '@/lib/hosts'

export function LandingRoute() {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const { subscription, isLoading: isLoadingSubscription } = useSubscription()
  const { toast } = useToast()

  // Redirect authenticated users to home (dashboard host)
  // When payment is enabled, only redirect if they have an active subscription
  React.useEffect(() => {
    if (!isAuthenticated || isRestoringSession) return

    if (getAdapters().env.enablePayment) {
      if (!isLoadingSubscription) {
        const hasActiveSubscription =
          subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'
        if (hasActiveSubscription) {
          goToDashboard('/home')
        }
      }
    } else {
      goToDashboard('/home')
    }
  }, [isAuthenticated, isRestoringSession, isLoadingSubscription, subscription])

  // Listen for toast events
  React.useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      toast(customEvent.detail)
    }

    window.addEventListener('toast:show', handleToastEvent)
    return () => window.removeEventListener('toast:show', handleToastEvent)
  }, [toast])

  // Scroll to hash anchor after landing page renders (e.g. /#features from other pages)
  React.useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    // Defer so sections are in the DOM before scrolling
    const id = requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [])

  // Handle session expiry — redirect to login on dashboard host
  React.useEffect(() => {
    const handleSessionExpired = () => {
      goToDashboard('/login?sessionExpired=1')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [])

  const handleSignIn = () => {
    goToDashboard('/login')
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

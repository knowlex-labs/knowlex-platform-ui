import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { LandingPage } from '@/components/landing/landing-page'
import { LoginModal } from '@/components/auth/login-modal'
import { SignupModal } from '@/components/auth/signup-modal'
import { useToast } from '@/hooks/use-toast'

export function LandingRoute() {
  const { isAuthenticated, isRestoringSession, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [loginOpen, setLoginOpen] = React.useState(false)
  const [signupOpen, setSignupOpen] = React.useState(false)
  const [sessionExpired, setSessionExpired] = React.useState(false)

  // If user arrived via redirect from protected route, auto-open login
  React.useEffect(() => {
    if (location.state?.from) {
      setLoginOpen(true)
    }
  }, [location.state])

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (isAuthenticated && !isRestoringSession) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isRestoringSession, navigate, location.state])

  // Listen for toast events
  React.useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      toast(customEvent.detail)
    }

    window.addEventListener('toast:show', handleToastEvent)
    return () => window.removeEventListener('toast:show', handleToastEvent)
  }, [toast])

  // Handle session expiry
  React.useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true)
      setLoginOpen(true)
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [])

  // Reset session expired flag on successful login
  React.useEffect(() => {
    if (isAuthenticated && sessionExpired) {
      setSessionExpired(false)
    }
  }, [isAuthenticated, sessionExpired])

  const handleTryIt = () => {
    setLoginOpen(true)
  }

  const handleContinueAsGuest = async () => {
    try {
      await continueAsGuest()
    } catch (err) {
      console.error('Failed to continue as guest:', err)
    }
  }

  const handleSwitchToSignup = () => {
    setLoginOpen(false)
    setSignupOpen(true)
  }

  const handleSwitchToLogin = () => {
    setSignupOpen(false)
    setLoginOpen(true)
  }

  // Show loading while restoring session
  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ledger-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger-black mx-auto mb-4"></div>
          <p className="text-ledger-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <LandingPage onSignIn={handleTryIt} onContinueAsGuest={handleContinueAsGuest} />
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToSignup={handleSwitchToSignup}
        sessionExpired={sessionExpired}
      />
      <SignupModal
        open={signupOpen}
        onOpenChange={setSignupOpen}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  )
}

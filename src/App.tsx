import * as React from 'react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { NavigationProvider, useNavigation } from '@/contexts/navigation-context'
import { LandingPage } from '@/components/landing/landing-page'
import { LoginModal } from '@/components/auth/login-modal'
import { SignupModal } from '@/components/auth/signup-modal'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { CaseList } from '@/components/cases/case-list'
import { CaseWorkspace } from '@/components/cases/case-workspace'
import { ClientList } from '@/components/clients/client-list'
import { ClientDetail } from '@/components/clients/client-detail'
import { AIResearch } from '@/components/ai-research/ai-research'
import { AccountSettings } from '@/components/settings/account-settings'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

function AppContent() {
  const { isAuthenticated, continueAsGuest, isRestoringSession } = useAuth()
  const { view, activeTab, selectedClientId, selectedCaseId, setView, setActiveTab } = useNavigation()
  const { toast } = useToast()

  const [loginOpen, setLoginOpen] = React.useState(false)
  const [signupOpen, setSignupOpen] = React.useState(false)
  const [sessionExpired, setSessionExpired] = React.useState(false)

  const handleTryIt = () => {
    setLoginOpen(true)
  }

  const handleContinueAsGuest = async () => {
    try {
      await continueAsGuest()
      setActiveTab('dashboard')
      setView('dashboard')
    } catch (err) {
      console.error('Failed to continue as guest:', err)
      // Error will be handled by the auth context
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
      setView('landing')
      setLoginOpen(true)
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [setView])

  // Reset session expired flag on successful login
  React.useEffect(() => {
    if (isAuthenticated && sessionExpired) {
      setSessionExpired(false)
    }
  }, [isAuthenticated, sessionExpired])

  // Redirect to landing if trying to access dashboard without auth
  React.useEffect(() => {
    if (!isAuthenticated && !isRestoringSession && view === 'dashboard') {
      setView('landing')
      setLoginOpen(true)
    }
  }, [isAuthenticated, isRestoringSession, view, setView])

  // Show loading state while restoring session
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

  // Landing View - always show at root path
  if (view === 'landing') {
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
        <Toaster />
      </>
    )
  }

  // Dashboard View - requires authentication
  if (!isAuthenticated) {
    // Should not reach here due to redirect effect, but just in case
    return null
  }

  // Dashboard View
  return (
    <>
      <DashboardLayout>
        {activeTab === 'dashboard' && <DashboardHome />}
        {activeTab === 'cases' && (
          selectedCaseId ? <CaseWorkspace caseId={selectedCaseId} /> : <CaseList />
        )}
        {activeTab === 'clients' && (
          selectedClientId ? <ClientDetail /> : <ClientList />
        )}
        {activeTab === 'ai-research' && <AIResearch />}
        {activeTab === 'account-settings' && <AccountSettings />}
      </DashboardLayout>
      <Toaster />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  )
}

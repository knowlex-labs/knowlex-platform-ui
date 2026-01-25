import * as React from 'react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { NavigationProvider, useNavigation } from '@/contexts/navigation-context'
import { LandingPage } from '@/components/landing/landing-page'
import { LoginModal } from '@/components/auth/login-modal'
import { SignupModal } from '@/components/auth/signup-modal'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ClientList } from '@/components/clients/client-list'
import { ClientDetail } from '@/components/clients/client-detail'
import { ComingSoon } from '@/components/placeholders/coming-soon'
import { AccountSettings } from '@/components/settings/account-settings'

function AppContent() {
  const { isAuthenticated, continueAsGuest, isRestoringSession } = useAuth()
  const { view, activeTab, selectedClientId, setView } = useNavigation()

  const [loginOpen, setLoginOpen] = React.useState(false)
  const [signupOpen, setSignupOpen] = React.useState(false)

  const handleTryIt = () => {
    setLoginOpen(true)
  }

  const handleContinueAsGuest = async () => {
    try {
      await continueAsGuest()
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
        />
        <SignupModal
          open={signupOpen}
          onOpenChange={setSignupOpen}
          onSwitchToLogin={handleSwitchToLogin}
        />
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
    <DashboardLayout>
      {activeTab === 'my-clients' && (
        selectedClientId ? <ClientDetail /> : <ClientList />
      )}
      {activeTab === 'timelines' && (
        <ComingSoon
          title="Case Timelines"
          description="Visualize case milestones, deadlines, and hearing schedules. This feature is currently in development."
        />
      )}
      {activeTab === 'drafting' && (
        <ComingSoon
          title="Drafting"
          description="Create and manage legal documents, contracts, and pleadings with AI assistance. This feature is currently in development."
        />
      )}
      {activeTab === 'ai-research' && (
        <ComingSoon
          title="AI Research"
          description="Access AI-powered legal research, case law analysis, and precedent matching. This feature is currently in development."
        />
      )}
      {activeTab === 'billings' && (
        <ComingSoon
          title="Billings"
          description="Track billable hours, generate invoices, and manage payments. This feature is currently in development."
        />
      )}
      {activeTab === 'account-settings' && (
        <AccountSettings />
      )}
    </DashboardLayout>
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

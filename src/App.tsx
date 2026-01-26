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
import { TimelinesBoard } from '@/components/timelines/timelines-board'
import { AccountSettings } from '@/components/settings/account-settings'

function AppContent() {
  const { isAuthenticated, continueAsGuest, isRestoringSession } = useAuth()
  const { view, activeTab, selectedClientId, selectedCaseId, setView } = useNavigation()

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
      {activeTab === 'dashboard' && <DashboardHome />}
      {activeTab === 'cases' && (
        selectedCaseId ? <CaseWorkspace caseId={selectedCaseId} /> : <CaseList />
      )}
      {activeTab === 'clients' && (
        selectedClientId ? <ClientDetail /> : <ClientList />
      )}
      {activeTab === 'ai-research' && <AIResearch />}
      {activeTab === 'timelines' && <TimelinesBoard />}
      {activeTab === 'account-settings' && <AccountSettings />}
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

import * as React from 'react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { NavigationProvider, useNavigation } from '@/contexts/navigation-context'
import { Hero } from '@/components/landing/hero'
import { LoginModal } from '@/components/auth/login-modal'
import { SignupModal } from '@/components/auth/signup-modal'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ClientList } from '@/components/clients/client-list'
import { ClientDetail } from '@/components/clients/client-detail'
import { ComingSoon } from '@/components/placeholders/coming-soon'

function AppContent() {
  const { isAuthenticated, continueAsGuest } = useAuth()
  const { view, activeTab, selectedClientId, setView } = useNavigation()

  const [loginOpen, setLoginOpen] = React.useState(false)
  const [signupOpen, setSignupOpen] = React.useState(false)

  const handleTryIt = () => {
    setLoginOpen(true)
  }

  const handleContinueAsGuest = () => {
    continueAsGuest()
    setView('dashboard')
  }

  const handleSwitchToSignup = () => {
    setLoginOpen(false)
    setSignupOpen(true)
  }

  const handleSwitchToLogin = () => {
    setSignupOpen(false)
    setLoginOpen(true)
  }

  // Redirect to dashboard if authenticated
  React.useEffect(() => {
    if (isAuthenticated && view === 'landing') {
      setView('dashboard')
    }
  }, [isAuthenticated, view, setView])

  // Landing View
  if (view === 'landing' || !isAuthenticated) {
    return (
      <>
        <Hero onTryIt={handleTryIt} onContinueAsGuest={handleContinueAsGuest} />
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

  // Dashboard View
  return (
    <DashboardLayout>
      {activeTab === 'my-clients' && (
        selectedClientId ? <ClientDetail /> : <ClientList />
      )}
      {activeTab === 'billings' && (
        <ComingSoon
          title="Billings & Invoices"
          description="Track billable hours, generate invoices, and manage payments. This feature is currently in development."
        />
      )}
      {activeTab === 'timelines' && (
        <ComingSoon
          title="Case Timelines"
          description="Visualize case milestones, deadlines, and hearing schedules. This feature is currently in development."
        />
      )}
      {activeTab === 'ai-research' && (
        <ComingSoon
          title="AI Research"
          description="Access AI-powered legal research, case law analysis, and precedent matching. This feature is currently in development."
        />
      )}
      {activeTab === 'settings' && (
        <ComingSoon
          title="Settings"
          description="Configure your account, notifications, and application preferences. This feature is currently in development."
        />
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

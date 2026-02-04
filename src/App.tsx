import * as React from 'react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { NavigationProvider, useNavigation } from '@/contexts/navigation-context'
import { LandingPage } from '@/components/landing/landing-page'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { CaseList } from '@/components/cases/case-list'
import { CaseWorkspace } from '@/components/cases/case-workspace'
import { ClientList } from '@/components/clients/client-list'
import { ClientDetail } from '@/components/clients/client-detail'
import { AIResearch } from '@/components/ai-research/ai-research'
import { TimelinesBoard } from '@/components/timelines/timelines-board'
import { AccountSettings } from '@/components/settings/account-settings'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

function AppContent() {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const { view, activeTab, selectedClientId, selectedCaseId, setView } = useNavigation()
  const { toast } = useToast()

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
      setView('landing')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [setView])

  // Redirect to landing if trying to access dashboard without auth
  React.useEffect(() => {
    if (!isAuthenticated && !isRestoringSession && view === 'dashboard') {
      setView('landing')
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
        <LandingPage />
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
        {activeTab === 'timelines' && <TimelinesBoard />}
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

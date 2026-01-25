import * as React from 'react'
import type { NavigationContextValue, NavigationState, NavigationView, DashboardTab } from '@/types'

const NavigationContext = React.createContext<NavigationContextValue | undefined>(undefined)

interface NavigationProviderProps {
  children: React.ReactNode
}

function getViewFromPath(): NavigationView {
  const path = window.location.pathname
  if (path.startsWith('/dashboard')) {
    return 'dashboard'
  }
  return 'landing'
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [state, setState] = React.useState<NavigationState>(() => ({
    view: getViewFromPath(),
    activeTab: 'my-clients',
    selectedClientId: null,
  }))

  // Sync URL with view changes
  const setView = React.useCallback((view: NavigationView) => {
    const newPath = view === 'dashboard' ? '/dashboard' : '/'
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath)
    }
    setState((prev) => ({ ...prev, view }))
  }, [])

  const setActiveTab = React.useCallback((activeTab: DashboardTab) => {
    setState((prev) => ({ ...prev, activeTab, selectedClientId: null }))
  }, [])

  const setSelectedClientId = React.useCallback((selectedClientId: string | null) => {
    setState((prev) => ({ ...prev, selectedClientId }))
  }, [])

  // Handle browser back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromPath()
      setState((prev) => ({ ...prev, view }))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const value: NavigationContextValue = {
    ...state,
    setView,
    setActiveTab,
    setSelectedClientId,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = React.useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

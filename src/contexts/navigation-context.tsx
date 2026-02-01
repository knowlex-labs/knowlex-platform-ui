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
  const [state, setState] = React.useState<NavigationState>(() => {
    const savedCollapsed = localStorage.getItem('knowlex_sidebar_collapsed')
    const savedNavState = localStorage.getItem('knowlex_navigation_state')

    // Restore navigation state from localStorage if available
    let restoredState: Partial<NavigationState> = {}
    if (savedNavState) {
      try {
        restoredState = JSON.parse(savedNavState)
      } catch (e) {
        console.error('Failed to parse saved navigation state:', e)
      }
    }

    return {
      view: getViewFromPath(),
      activeTab: restoredState.activeTab || 'dashboard',
      selectedClientId: restoredState.selectedClientId || null,
      selectedCaseId: restoredState.selectedCaseId || null,
      sidebarCollapsed: savedCollapsed === 'true',
    }
  })

  // Sync URL with view changes
  const setView = React.useCallback((view: NavigationView) => {
    const newPath = view === 'dashboard' ? '/dashboard' : '/'
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath)
    }
    setState((prev) => ({ ...prev, view }))
  }, [])

  const setActiveTab = React.useCallback((activeTab: DashboardTab) => {
    setState((prev) => ({ ...prev, activeTab, selectedClientId: null, selectedCaseId: null }))
  }, [])

  const setSelectedClientId = React.useCallback((selectedClientId: string | null) => {
    setState((prev) => ({ ...prev, selectedClientId }))
  }, [])

  const setSelectedCaseId = React.useCallback((selectedCaseId: string | null) => {
    setState((prev) => ({ ...prev, selectedCaseId }))
  }, [])

  const setSidebarCollapsed = React.useCallback((sidebarCollapsed: boolean) => {
    localStorage.setItem('knowlex_sidebar_collapsed', String(sidebarCollapsed))
    setState((prev) => ({ ...prev, sidebarCollapsed }))
  }, [])

  // Persist navigation state to localStorage
  React.useEffect(() => {
    const stateToSave = {
      activeTab: state.activeTab,
      selectedClientId: state.selectedClientId,
      selectedCaseId: state.selectedCaseId,
    }
    localStorage.setItem('knowlex_navigation_state', JSON.stringify(stateToSave))
  }, [state.activeTab, state.selectedClientId, state.selectedCaseId])

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
    setSelectedCaseId,
    setSidebarCollapsed,
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

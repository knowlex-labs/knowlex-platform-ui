import * as React from 'react'
import type { NavigationContextValue, NavigationState, NavigationView, DashboardTab } from '@/types'

const NavigationContext = React.createContext<NavigationContextValue | undefined>(undefined)

interface NavigationProviderProps {
  children: React.ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [state, setState] = React.useState<NavigationState>({
    view: 'landing',
    activeTab: 'my-clients',
    selectedClientId: null,
  })

  const setView = React.useCallback((view: NavigationView) => {
    setState((prev) => ({ ...prev, view }))
  }, [])

  const setActiveTab = React.useCallback((activeTab: DashboardTab) => {
    setState((prev) => ({ ...prev, activeTab, selectedClientId: null }))
  }, [])

  const setSelectedClientId = React.useCallback((selectedClientId: string | null) => {
    setState((prev) => ({ ...prev, selectedClientId }))
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

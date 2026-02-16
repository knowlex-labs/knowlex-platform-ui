import * as React from 'react'

interface UIStateContextValue {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  showAddCaseModal: boolean
  setShowAddCaseModal: (show: boolean) => void
}

const UIStateContext = React.createContext<UIStateContextValue | undefined>(undefined)

interface UIStateProviderProps {
  children: React.ReactNode
}

export function UIStateProvider({ children }: UIStateProviderProps) {
  const [sidebarCollapsed, setSidebarCollapsedState] = React.useState(() => {
    return localStorage.getItem('knowlex_sidebar_collapsed') === 'true'
  })
  const [showAddCaseModal, setShowAddCaseModal] = React.useState(false)

  const setSidebarCollapsed = React.useCallback((collapsed: boolean) => {
    localStorage.setItem('knowlex_sidebar_collapsed', String(collapsed))
    setSidebarCollapsedState(collapsed)
  }, [])

  const value: UIStateContextValue = {
    sidebarCollapsed,
    setSidebarCollapsed,
    showAddCaseModal,
    setShowAddCaseModal,
  }

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  )
}

export function useUIState() {
  const context = React.useContext(UIStateContext)
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider')
  }
  return context
}

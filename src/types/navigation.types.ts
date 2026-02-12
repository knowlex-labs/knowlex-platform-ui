export type NavigationView = 'landing' | 'dashboard'

export type DashboardTab =
  | 'dashboard'
  | 'cases'
  | 'clients'
  | 'ai-research'
  | 'account-settings'

export interface NavigationState {
  view: NavigationView
  activeTab: DashboardTab
  selectedClientId: string | null
  selectedCaseId: string | null
  sidebarCollapsed: boolean
}

export interface NavigationContextValue extends NavigationState {
  setView: (view: NavigationView) => void
  setActiveTab: (tab: DashboardTab) => void
  setSelectedClientId: (id: string | null) => void
  setSelectedCaseId: (id: string | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

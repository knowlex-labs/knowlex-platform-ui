export type DashboardTab =
  | 'dashboard'
  | 'cases'
  | 'drafting'
  | 'translation'
  | 'cause-lists'
  | 'clients'
  | 'judgments'
  | 'account-settings'
  | 'documents'
  | 'moodboard'

export type NavigationView = 'landing' | 'dashboard'

export interface NavigationState {
  view: NavigationView
  activeTab: DashboardTab
  selectedClientId: string | null
  selectedCaseId: string | null
  sidebarCollapsed: boolean
  showAddCaseModal: boolean
}

export interface NavigationContextValue extends NavigationState {
  setView: (view: NavigationView) => void
  setActiveTab: (activeTab: DashboardTab) => void
  setSelectedClientId: (id: string | null) => void
  setSelectedCaseId: (id: string | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setShowAddCaseModal: (show: boolean) => void
}

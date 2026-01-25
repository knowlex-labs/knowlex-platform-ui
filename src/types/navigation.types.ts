export type NavigationView = 'landing' | 'dashboard'

export type DashboardTab =
  | 'my-clients'
  | 'billings'
  | 'timelines'
  | 'ai-research'
  | 'settings'

export interface NavigationState {
  view: NavigationView
  activeTab: DashboardTab
  selectedClientId: string | null
}

export interface NavigationContextValue extends NavigationState {
  setView: (view: NavigationView) => void
  setActiveTab: (tab: DashboardTab) => void
  setSelectedClientId: (id: string | null) => void
}

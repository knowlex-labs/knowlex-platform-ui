import type { DashboardTab } from '@/types'

export interface SidebarTabConfig {
  id: DashboardTab
  label: string
  icon: string
  path: string
}

export const SIDEBAR_TABS: SidebarTabConfig[] = [
  { id: 'dashboard', label: 'Home', icon: 'home', path: '/dashboard' },
  { id: 'cases', label: 'Cases', icon: 'briefcase', path: '/cases' },
  { id: 'clients', label: 'Clients', icon: 'users', path: '/clients' },
  { id: 'ai-research', label: 'AI Research', icon: 'brain', path: '/ai-research' },
]

export const STATUS_COLORS = {
  active: 'bg-ledger-black text-ledger-white',
  pending: 'bg-ledger-gray-400 text-ledger-white',
  closed: 'bg-ledger-gray-200 text-ledger-gray-700',
  'on-hold': 'bg-ledger-gray-700 text-ledger-white',
  appealed: 'bg-ledger-gray-600 text-ledger-white',
  blocked: 'bg-ledger-gray-800 text-ledger-white',
} as const

export const APP_NAME = 'Knowlex'
export const APP_TAGLINE = "India's Smart Legal Workflow"

// Demo user credentials for "Continue as Guest" functionality
export const DEMO_USER_USERNAME = 'demo_user'
export const DEMO_USER_PASSWORD = 'demo123'

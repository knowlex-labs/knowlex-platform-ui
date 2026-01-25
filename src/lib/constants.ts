import type { DashboardTab } from '@/types'

export interface SidebarTabConfig {
  id: DashboardTab
  label: string
  icon: string
}

export const SIDEBAR_TABS: SidebarTabConfig[] = [
  { id: 'my-clients', label: 'Clients', icon: 'users' },
  { id: 'timelines', label: 'Timelines', icon: 'calendar' },
  { id: 'drafting', label: 'Drafting', icon: 'file-text' },
  { id: 'ai-research', label: 'AI Research', icon: 'brain' },
  { id: 'billings', label: 'Billings', icon: 'receipt' },
]

export const STATUS_COLORS = {
  active: 'bg-ledger-black text-ledger-white',
  pending: 'bg-ledger-gray-400 text-ledger-white',
  closed: 'bg-ledger-gray-200 text-ledger-gray-700',
  'on-hold': 'bg-ledger-gray-700 text-ledger-white',
  appealed: 'bg-ledger-gray-600 text-ledger-white',
  blocked: 'bg-ledger-gray-800 text-ledger-white',
} as const

export const APP_NAME = 'Knowlex AI'
export const APP_TAGLINE = "AI-Powered India's Legal Workflow"

// Demo user credentials for "Continue as Guest" functionality
export const DEMO_USER_USERNAME = 'demo_user'
export const DEMO_USER_PASSWORD = 'demo123'

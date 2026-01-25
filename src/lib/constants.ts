import type { DashboardTab } from '@/types'

export interface SidebarTabConfig {
  id: DashboardTab
  label: string
  icon: string
}

export const SIDEBAR_TABS: SidebarTabConfig[] = [
  { id: 'my-clients', label: 'My Clients', icon: 'users' },
  { id: 'billings', label: 'Billings & Invoices', icon: 'receipt' },
  { id: 'timelines', label: 'Timelines', icon: 'calendar' },
  { id: 'ai-research', label: 'AI Research', icon: 'brain' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
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

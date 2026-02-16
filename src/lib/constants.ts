import type { DashboardTab } from '@/types'

export interface SidebarTabConfig {
  id: DashboardTab
  label: string
  icon: string
  path: string
}

export const SIDEBAR_TABS: SidebarTabConfig[] = [
  { id: 'dashboard', label: 'Home', icon: 'home', path: '/home' },
  { id: 'cases', label: 'Cases', icon: 'briefcase', path: '/cases' },
  { id: 'clients', label: 'Clients', icon: 'users', path: '/clients' },
  { id: 'ai-research', label: 'AI Research', icon: 'brain', path: '/ai-research' },
]

export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  closed: 'bg-gray-100 text-gray-800 border border-gray-200',
  'on-hold': 'bg-orange-100 text-orange-800 border border-orange-200',
  appealed: 'bg-blue-100 text-blue-800 border border-blue-200',
  blocked: 'bg-red-100 text-red-800 border border-red-200',
} as const

export const APP_NAME = 'Knowlex'
export const APP_TAGLINE = "India's Smart Legal Workflow"

// Demo user credentials for "Continue as Guest" functionality
export const DEMO_USER_USERNAME = 'demo_user'
export const DEMO_USER_PASSWORD = 'demo123'

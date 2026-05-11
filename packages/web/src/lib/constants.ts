import type { DashboardTab } from '@knowlex/core/types'

export interface SidebarTabConfig {
  id: DashboardTab
  label: string
  icon: string
  path: string
  locked?: boolean
  featureFlag?: string
}

export const SIDEBAR_TABS: SidebarTabConfig[] = [
  { id: 'dashboard',   label: 'Home',         icon: 'home',           path: '/home' },
  { id: 'cases',       label: 'Cases',         icon: 'briefcase',      path: '/cases' },
  { id: 'cause-lists', label: 'Cause Lists',   icon: 'clipboard-list', path: '/cause-lists' },
  { id: 'clients',     label: 'Clients',       icon: 'users',          path: '/clients' },
  { id: 'drafting',    label: 'Drafting',      icon: 'pen-line',       path: '/drafting' },
  { id: 'documents',   label: 'Documents',     icon: 'files',          path: '/documents' },
  { id: 'moodboard',   label: 'Tasks',         icon: 'layout-grid',    path: '/moodboard', featureFlag: 'MOODBOARD' },
  { id: 'judgments',   label: 'Judgments',     icon: 'scale',          path: '/judgments' },
]

export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  closed: 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
  'on-hold': 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  appealed: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  blocked: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  archived: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
} as const

export const APP_NAME = 'Knowlex'
export const APP_TAGLINE = "India's Smart Legal Workflow"

// Demo user credentials for "Continue as Guest" functionality
export const DEMO_USER_USERNAME = 'demo_user'
export const DEMO_USER_PASSWORD = 'demo123'

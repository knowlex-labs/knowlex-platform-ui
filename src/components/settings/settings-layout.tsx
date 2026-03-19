import { NavLink, Outlet } from 'react-router-dom'
import { User, CreditCard, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsTabs = [
  { path: '/settings', label: 'Account', icon: User, end: true },
  { path: '/settings/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings/wallet', label: 'Wallet', icon: Wallet },
]

export function SettingsLayout() {
  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
          Settings
        </h1>
        <p className="text-sm text-ledger-gray-500 mt-1">
          Manage your account, billing, and wallet
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-kx-card-border mb-6">
        {settingsTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-kx-primary-600 text-kx-primary-700'
                  : 'border-transparent text-ledger-gray-500 hover:text-kx-primary-600 hover:border-ledger-gray-300'
              )
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}

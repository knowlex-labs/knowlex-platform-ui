import { Users, Receipt, Calendar, Brain, Settings, LogOut } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/navigation-context'
import { useAuth } from '@/contexts/auth-context'
import { SIDEBAR_TABS, APP_NAME } from '@/lib/constants'
import type { DashboardTab } from '@/types'

const iconMap = {
  users: Users,
  receipt: Receipt,
  calendar: Calendar,
  brain: Brain,
  settings: Settings,
}

export function Sidebar() {
  const { activeTab, setActiveTab, setView } = useNavigation()
  const { user, isGuest, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-ledger-white border-r border-ledger-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-ledger-gray-200">
        <h1 className="text-xl font-serif font-semibold text-ledger-black">
          {APP_NAME}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DashboardTab)}
          orientation="vertical"
        >
          <TabsList>
            {SIDEBAR_TABS.map((tab) => {
              const Icon = iconMap[tab.icon as keyof typeof iconMap]
              return (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </nav>

      {/* User Section */}
      <div className="border-t border-ledger-gray-200 p-4">
        {user && (
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ledger-black truncate">
                {user.firstName} {user.lastName}
              </p>
              {isGuest && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-ledger-gray-200 text-ledger-gray-600 rounded-sm">
                  Guest
                </span>
              )}
            </div>
            <p className="text-xs text-ledger-gray-500 truncate">
              {user.email}
            </p>
          </div>
        )}
        <Separator className="mb-3" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-ledger-gray-600 hover:text-ledger-black"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {isGuest ? 'Exit Demo' : 'Sign Out'}
        </Button>
      </div>
    </aside>
  )
}

import { Home, Briefcase, Users, Brain, KanbanSquare, HelpCircle, User as UserIcon, Mail, LogOut, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useNavigation } from '@/contexts/navigation-context'
import { useAuth } from '@/contexts/auth-context'
import { SIDEBAR_TABS, APP_NAME, DEMO_USER_USERNAME } from '@/lib/constants'
import type { DashboardTab } from '@/types'
import * as React from 'react'

const iconMap = {
  home: Home,
  briefcase: Briefcase,
  users: Users,
  brain: Brain,
  'kanban-square': KanbanSquare,
}

interface SidebarContentProps {
  onItemClick?: () => void
  collapsed?: boolean
}

export function SidebarContent({ onItemClick, collapsed = false }: SidebarContentProps) {
  const { activeTab, setActiveTab, setView, setSidebarCollapsed } = useNavigation()
  const { user, logout } = useAuth()
  const [showHelpDialog, setShowHelpDialog] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const handleLogout = () => {
    logout()
    setView('landing')
    setShowUserMenu(false)
    onItemClick?.()
  }

  const getUserDisplayName = () => {
    if (user) {
      return user.firstName || user.username || 'User'
    }
    return 'User'
  }

  const isDemoUser = user?.username === DEMO_USER_USERNAME

  const handleTabChange = (value: string) => {
    setActiveTab(value as DashboardTab)
    onItemClick?.()
  }

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          orientation="vertical"
        >
          <TabsList>
            {SIDEBAR_TABS.map((tab) => {
              const Icon = iconMap[tab.icon as keyof typeof iconMap]
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="min-h-[48px]"
                  title={collapsed ? tab.label : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {!collapsed && <span>{tab.label}</span>}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </nav>

      {/* User Section */}
      <div className="border-t border-ledger-gray-200 p-4 space-y-3">
        {/* Toggle Collapse Button */}
        {!onItemClick && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-ledger-gray-600 hover:text-ledger-black min-h-[48px]"
              onClick={() => setSidebarCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Separator />
          </>
        )}

        {/* Help and Support Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-ledger-gray-600 hover:text-ledger-black min-h-[48px]"
          onClick={() => setShowHelpDialog(true)}
          title={collapsed ? 'Help and Support' : undefined}
        >
          <HelpCircle className="h-4 w-4" />
          {!collapsed && 'Help and Support'}
        </Button>

        <Separator />

        {/* User Name Display */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-ledger-gray-100 transition-colors text-left min-h-[48px]"
              title={collapsed ? getUserDisplayName() : undefined}
            >
              <div className="h-8 w-8 rounded-full bg-ledger-gray-200 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-4 w-4 text-ledger-gray-600" />
              </div>
              {!collapsed && (
                <>
                  <p className="text-sm font-medium text-ledger-black truncate flex-1">
                    {getUserDisplayName()}
                  </p>
                  <ChevronDown className={`h-4 w-4 text-ledger-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-ledger-white border border-ledger-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    setActiveTab('account-settings' as DashboardTab)
                    setShowUserMenu(false)
                    onItemClick?.()
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-ledger-black hover:bg-ledger-gray-50 transition-colors flex items-center gap-2 min-h-[48px]"
                >
                  <UserIcon className="h-4 w-4" />
                  Account Settings
                </button>
                <Separator />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 min-h-[48px]"
                >
                  <LogOut className="h-4 w-4" />
                  {isDemoUser ? 'Exit Demo' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help and Support Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help and Support</DialogTitle>
            <DialogDescription>
              Reach out to us for any help
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-ledger-gray-50 rounded-lg border border-ledger-gray-200">
              <Mail className="h-5 w-5 text-ledger-gray-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-ledger-black">Email us</p>
                <a
                  href="mailto:nakul.jain@getknowlex.com"
                  className="text-sm text-ledger-gray-600 hover:text-ledger-black underline"
                >
                  nakul.jain@getknowlex.com
                </a>
              </div>
            </div>
            <p className="text-sm text-ledger-gray-500">
              We're here to help! Send us an email and we'll get back to you as soon as possible.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function Sidebar() {
  const { sidebarCollapsed } = useNavigation()

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-ledger-white border-r border-ledger-gray-200 flex-col hidden md:flex transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-ledger-gray-200">
        <h1 className={`text-xl font-serif font-semibold text-ledger-black transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
          {APP_NAME}
        </h1>
        {sidebarCollapsed && (
          <div className="flex items-center justify-center -ml-4">
            <span className="text-xl font-serif font-semibold text-ledger-black">K</span>
          </div>
        )}
      </div>

      <SidebarContent collapsed={sidebarCollapsed} />
    </aside>
  )
}

import { Home, Briefcase, Users, Brain, HelpCircle, User as UserIcon, Mail, LogOut, ChevronDown, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { SIDEBAR_TABS, APP_NAME, DEMO_USER_USERNAME } from '@/lib/constants'
import * as React from 'react'

const iconMap = {
  home: Home,
  briefcase: Briefcase,
  users: Users,
  brain: Brain,
}

// Derive active tab ID from the current pathname
function getActiveTabFromPath(pathname: string): string {
  for (const tab of SIDEBAR_TABS) {
    if (pathname.startsWith(tab.path)) {
      return tab.id
    }
  }
  return 'dashboard'
}

interface SidebarContentProps {
  onItemClick?: () => void
  collapsed?: boolean
}

export function SidebarContent({ onItemClick, collapsed = false }: SidebarContentProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSidebarCollapsed } = useUIState()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [showHelpDialog, setShowHelpDialog] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const activeTab = getActiveTabFromPath(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/')
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
    const tab = SIDEBAR_TABS.find(t => t.id === value)
    if (tab) {
      navigate(tab.path)
    }
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
        {/* Toggle Collapse Button */}
        {!onItemClick && (
          <>
            <div className={cn("flex mb-1", collapsed ? "justify-center" : "justify-end")}>
              <Button
                variant="ghost"
                className="w-8 h-8 p-0 justify-center text-ledger-gray-600 hover:text-kx-primary-700 hover:bg-kx-primary-50"
                onClick={() => setSidebarCollapsed(!collapsed)}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Separator className="my-2" />
          </>
        )}

        {/* Help and Support Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-ledger-gray-600 hover:text-kx-primary-700 hover:bg-kx-primary-50 h-10",
            collapsed ? "justify-center px-0" : "justify-start px-4"
          )}
          onClick={() => setShowHelpDialog(true)}
          title="Help and Support"
        >
          <HelpCircle className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Help & Support</span>}
        </Button>

        {/* Dark/Light Mode Toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-ledger-gray-600 hover:text-kx-primary-700 hover:bg-kx-primary-50 h-10",
            collapsed ? "justify-center px-0" : "justify-start px-4"
          )}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && <span className="ml-3">{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
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
              <div className="h-8 w-8 rounded-full bg-kx-primary-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-4 w-4 text-kx-primary-500" />
              </div>
              {!collapsed && (
                <>
                  <p className="text-sm font-medium text-kx-primary-900 truncate flex-1">
                    {getUserDisplayName()}
                  </p>
                  <ChevronDown className={`h-4 w-4 text-ledger-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className={cn(
                "absolute bg-kx-card border border-kx-card-border rounded-lg shadow-lg overflow-hidden z-50",
                collapsed
                  ? "left-full bottom-0 ml-2 w-56"
                  : "bottom-full left-0 right-0 mb-2"
              )}>
                <button
                  onClick={() => {
                    navigate('/settings')
                    setShowUserMenu(false)
                    onItemClick?.()
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-kx-primary-900 hover:bg-kx-primary-50 transition-colors flex items-center gap-2 min-h-[48px]"
                >
                  <UserIcon className="h-4 w-4" />
                  Account Settings
                </button>
                <Separator />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center gap-2 min-h-[48px]"
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
                <p className="text-sm font-medium text-kx-primary-900">Email us</p>
                <a
                  href="mailto:nakul.jain@getknowlex.com"
                  className="text-sm text-ledger-gray-600 hover:text-kx-primary-700 underline"
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
  const { sidebarCollapsed: collapsed } = useUIState()

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-kx-card border-r border-kx-card-border shadow-lg flex-col hidden md:flex transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-ledger-gray-200">
        {collapsed ? (
          <div className="flex items-center justify-center -ml-4">
            <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-7 w-auto" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-7 w-auto" />
            <span className="text-xl font-serif font-semibold text-kx-primary-900">{APP_NAME}</span>
          </div>
        )}
      </div>

      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}

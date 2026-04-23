import { Home, Briefcase, Users, Brain, Scale, ClipboardList, HelpCircle, User as UserIcon, Mail, LogOut, ChevronDown, PanelLeft, Sun, Moon, CreditCard, Wallet, ArrowLeft, Files, PenLine, Sparkles, LayoutGrid } from 'lucide-react'
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
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { useSubscription } from '@/hooks/use-subscription'
import { useSubscriptionPreferences } from '@/contexts/subscription-preferences-context'
import { SIDEBAR_TABS, APP_NAME, DEMO_USER_USERNAME } from '@/lib/constants'
import * as React from 'react'

const SETTINGS_TABS = [
  { path: '/settings', label: 'Account', icon: UserIcon, end: true },
  { path: '/settings/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings/wallet', label: 'Wallet', icon: Wallet },
]

const iconMap = {
  home: Home,
  briefcase: Briefcase,
  users: Users,
  'clipboard-list': ClipboardList,
  scale: Scale,
  brain: Brain,
  files: Files,
  'pen-line': PenLine,
  'layout-grid': LayoutGrid,
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
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const { isLocked } = useSubscriptionPreferences()
  const [showHelpDialog, setShowHelpDialog] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const activeTab = getActiveTabFromPath(location.pathname)
  const visibleTabs = React.useMemo(
    () => SIDEBAR_TABS.filter((tab) => !(tab.featureFlag && isLocked(tab.featureFlag))),
    [isLocked]
  )

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
    const tab = visibleTabs.find(t => t.id === value)
    if (tab) {
      navigate(tab.path)
    }
    onItemClick?.()
  }

  const isSettings = location.pathname.startsWith('/settings')

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {isSettings ? (
          <div className="flex flex-col">
            {/* Back to Home */}
            <button
              onClick={() => { navigate('/home'); onItemClick?.() }}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-sans font-medium text-ledger-gray-500 hover:text-kx-primary-700 hover:bg-kx-primary-50 dark:hover:bg-white/5 transition-colors min-h-[44px]',
              )}
              title={collapsed ? 'Back to Home' : undefined}
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Back to Home</span>}
            </button>

            {!collapsed && (
              <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-ledger-gray-400">
                Settings
              </p>
            )}

            {SETTINGS_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                onClick={() => onItemClick?.()}
                title={collapsed ? tab.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors min-h-[44px] border-l-2',
                    isActive
                      ? 'border-kx-primary-600 bg-kx-primary-50/60 text-kx-primary-700 dark:bg-kx-primary-900/20 dark:text-kx-primary-400'
                      : 'border-transparent text-ledger-gray-500 hover:text-kx-primary-700 hover:bg-kx-primary-50 dark:hover:bg-white/5'
                  )
                }
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{tab.label}</span>}
              </NavLink>
            ))}
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            orientation="vertical"
          >
            <TabsList>
              {visibleTabs.map((tab) => {
                const Icon = iconMap[tab.icon as keyof typeof iconMap]

                if (tab.locked) {
                  return (
                    <div
                      key={tab.id}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-sans font-medium',
                        'text-ledger-gray-400 cursor-not-allowed opacity-60 select-none',
                        'min-h-[44px]'
                      )}
                      title={collapsed ? `${tab.label} — Coming Soon` : undefined}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {!collapsed && (
                        <>
                          <span>{tab.label}</span>
                          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-ledger-gray-200 dark:bg-ledger-gray-300 text-ledger-gray-500 dark:text-ledger-gray-600 px-1.5 py-0.5 rounded-full leading-none">
                            Soon
                          </span>
                        </>
                      )}
                    </div>
                  )
                }

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="min-h-[44px]"
                    title={collapsed ? tab.label : undefined}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {!collapsed && <span>{tab.label}</span>}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-ledger-gray-200 p-3 space-y-2">
        {/* Upgrade Account Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full h-9 text-kx-primary-600 hover:text-kx-primary-700 hover:bg-kx-primary-50 dark:hover:bg-white/5",
            collapsed ? "justify-center px-0" : "justify-start px-4"
          )}
          onClick={() => navigate('/settings/billing')}
          title="Upgrade Account"
        >
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Upgrade Account</span>}
        </Button>

        {/* Help and Support Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-ledger-gray-600 hover:text-kx-primary-700 hover:bg-kx-primary-50 h-9",
            collapsed ? "justify-center px-0" : "justify-start px-4"
          )}
          onClick={() => setShowHelpDialog(true)}
          title="Help and Support"
        >
          <HelpCircle className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Help & Support</span>}
        </Button>

        {/* Dark/Light Mode Toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-ledger-gray-600 hover:text-kx-primary-700 hover:bg-kx-primary-50 h-9",
            collapsed ? "justify-center px-0" : "justify-start px-4"
          )}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="ml-3">{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </Button>

        <Separator />

        {/* User Name Display */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-ledger-gray-100 transition-colors text-left min-h-[44px]"
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

            {/* Dropdown Menu — opens upward, above the user button */}
            {showUserMenu && (
              <div className={cn(
                "absolute bg-kx-card border border-kx-card-border rounded-lg shadow-lg overflow-hidden z-[100]",
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
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-kx-primary-900 hover:bg-kx-primary-50 transition-colors flex items-center gap-2 min-h-[40px]"
                >
                  <UserIcon className="h-4 w-4" />
                  Account Settings
                </button>
                <Separator />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center gap-2 min-h-[40px]"
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

function PlanBadge({ planType, collapsed }: { planType?: string; collapsed: boolean }) {
  const isFree = !planType || planType === 'FREE'
  const isPlus = planType === 'PLUS'
  const isPremium = planType === 'PREMIUM'
  const label = isFree ? 'Free' : isPremium ? 'Premium' : isPlus ? 'Plus' : 'Pro'

  const colorClass = isFree
    ? 'bg-ledger-gray-200 text-ledger-gray-600 dark:bg-ledger-gray-700 dark:text-ledger-gray-400'
    : isPremium
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
      : isPlus
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
        : 'bg-kx-primary-100 text-kx-primary-700 dark:bg-kx-primary-900/40 dark:text-kx-primary-400'

  if (collapsed) {
    return (
      <div
        title={label}
        className={cn(
          'mx-auto mt-1 w-7 h-4 rounded-full flex items-center justify-center text-[9px] font-bold',
          colorClass
        )}
      >
        {isFree ? 'F' : isPremium ? '✦' : isPlus ? '+' : 'P'}
      </div>
    )
  }

  return (
    <span
      className={cn(
        'ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide',
        colorClass
      )}
    >
      {label}
    </span>
  )
}

export function Sidebar() {
  const { sidebarCollapsed: collapsed, setSidebarCollapsed } = useUIState()
  const { subscription } = useSubscription()
  const planType = subscription?.planType ?? subscription?.planName
  const navigate = useNavigate()

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-kx-card border-r border-kx-card-border shadow-sm flex-col hidden md:flex transition-all duration-300 overscroll-contain ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo + Collapse Toggle */}
      <div className="px-4 py-4 border-b border-ledger-gray-200">
        {collapsed ? (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="w-8 h-8 p-0 justify-center text-ledger-gray-500 hover:text-kx-primary-700 hover:bg-kx-primary-50"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand sidebar"
            >
              <PanelLeft className="h-[18px] w-[18px]" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-7 w-auto dark:invert" />
                <span className="text-xl font-serif font-semibold text-kx-primary-900">{APP_NAME}</span>
              </button>
              <PlanBadge planType={planType} collapsed={false} />
            </div>
            <Button
              variant="ghost"
              className="w-8 h-8 p-0 justify-center text-ledger-gray-500 hover:text-kx-primary-700 hover:bg-kx-primary-50"
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse sidebar"
            >
              <PanelLeft className="h-[18px] w-[18px]" />
            </Button>
          </div>
        )}
      </div>

      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}

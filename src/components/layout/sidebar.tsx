import { Users, Receipt, Calendar, Brain, FileText, HelpCircle, User as UserIcon, Mail } from 'lucide-react'
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
import { SIDEBAR_TABS, APP_NAME } from '@/lib/constants'
import type { DashboardTab } from '@/types'
import * as React from 'react'

const iconMap = {
  users: Users,
  receipt: Receipt,
  calendar: Calendar,
  brain: Brain,
  'file-text': FileText,
}

export function Sidebar() {
  const { activeTab, setActiveTab, setView } = useNavigation()
  const { user, logout } = useAuth()
  const [showHelpDialog, setShowHelpDialog] = React.useState(false)

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  const getUserDisplayName = () => {
    if (user) {
      return user.firstName || user.username || 'User'
    }
    return 'User'
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
      <nav className="flex-1 py-4 overflow-y-auto">
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
      <div className="border-t border-ledger-gray-200 p-4 space-y-3">
        {/* Help and Support Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-ledger-gray-600 hover:text-ledger-black"
          onClick={() => setShowHelpDialog(true)}
        >
          <HelpCircle className="h-4 w-4" />
          Help and Support
        </Button>

        <Separator />

        {/* User Name Display - Clickable to open Account Settings */}
        {user && (
          <button
            onClick={() => setActiveTab('account-settings' as DashboardTab)}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-ledger-gray-100 transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-full bg-ledger-gray-200 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-4 w-4 text-ledger-gray-600" />
            </div>
            <p className="text-sm font-medium text-ledger-black truncate">
              {getUserDisplayName()}
            </p>
          </button>
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
                  href="mailto:iamnakuljain@gmail.com"
                  className="text-sm text-ledger-gray-600 hover:text-ledger-black underline"
                >
                  iamnakuljain@gmail.com
                </a>
              </div>
            </div>
            <p className="text-sm text-ledger-gray-500">
              We're here to help! Send us an email and we'll get back to you as soon as possible.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}

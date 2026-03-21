import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar, SidebarContent } from './sidebar'
import { MobileHeader } from './mobile-header'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { APP_NAME } from '@/lib/constants'
import { useUIState } from '@/contexts/ui-context'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIState()
  const location = useLocation()

  const isWorkspaceView = /^\/cases\/[^/]+/.test(location.pathname)
  const isFullBleed = isWorkspaceView || location.pathname === '/ai-research'
  const prevPathRef = React.useRef(location.pathname)

  // Auto-collapse sidebar when entering AI Research
  React.useEffect(() => {
    if (location.pathname === '/ai-research' && prevPathRef.current !== '/ai-research') {
      setSidebarCollapsed(true)
    }
    prevPathRef.current = location.pathname
  }, [location.pathname, setSidebarCollapsed])

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleMenuClose = () => {
    setMobileMenuOpen(false)
  }

  const handleUserMenuClick = () => {
    setMobileMenuOpen(true)
  }

  return (
    <div className="min-h-screen bg-kx-surface">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <MobileHeader
        onMenuClick={() => setMobileMenuOpen(true)}
        onUserClick={handleUserMenuClick}
      />

      {/* Mobile Navigation Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-5 border-b border-ledger-gray-200">
            <SheetTitle>{APP_NAME}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            <SidebarContent onItemClick={handleMenuClose} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className={`min-h-screen w-auto overflow-x-hidden transition-[margin] duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <div className="pt-14 md:pt-0">
          <div className={isFullBleed ? 'md:pt-2' : 'p-4 md:p-8'}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

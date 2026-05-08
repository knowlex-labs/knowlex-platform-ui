import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar, SidebarContent } from './sidebar'
import { MobileHeader } from './mobile-header'
import { EmailVerificationBanner } from './email-verification-banner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { APP_NAME } from '@/lib/constants'
import { useUIState } from '@/contexts/ui-context'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIState()
  const location = useLocation()

  const isFullBleed = /^\/cases\/[^/]+/.test(location.pathname) || location.pathname === '/documents' || location.pathname === '/judgments'

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
      <main className={`w-auto overflow-x-hidden transition-[margin] duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} ${isFullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <div className={isFullBleed ? 'h-full flex flex-col pt-14 md:pt-0' : 'pt-14 md:pt-0'}>
          <EmailVerificationBanner />
          <div className={isFullBleed ? 'flex-1 min-h-0 overflow-hidden' : 'p-4 md:p-8'}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

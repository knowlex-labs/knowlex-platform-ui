import * as React from 'react'
import { Sidebar, SidebarContent } from './sidebar'
import { MobileHeader } from './mobile-header'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { APP_NAME } from '@/lib/constants'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleMenuClose = () => {
    setMobileMenuOpen(false)
  }

  const handleUserMenuClick = () => {
    // Open the drawer - user can access their menu from the sidebar
    setMobileMenuOpen(true)
  }

  return (
    <div className="min-h-screen bg-ledger-white">
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
      <main className="md:ml-64 min-h-screen">
        {/* Mobile top padding to account for fixed header */}
        <div className="pt-14 md:pt-0">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

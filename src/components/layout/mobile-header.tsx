import { Menu, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'

interface MobileHeaderProps {
  onMenuClick: () => void
  onUserClick: () => void
}

export function MobileHeader({ onMenuClick, onUserClick }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-ledger-white border-b border-ledger-gray-200 md:hidden safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Hamburger Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="p-0 h-11 w-11 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* App Name */}
        <h1 className="text-lg font-serif font-semibold text-ledger-black">
          {APP_NAME}
        </h1>

        {/* User Avatar Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUserClick}
          className="p-0 h-11 w-11 flex items-center justify-center"
          aria-label="User menu"
        >
          <div className="h-8 w-8 rounded-full bg-ledger-gray-200 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-ledger-gray-600" />
          </div>
        </Button>
      </div>
    </header>
  )
}

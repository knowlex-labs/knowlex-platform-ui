import { PanelLeft, PanelLeftClose, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResearchChatHeaderProps {
  title: string
  settingsOpen: boolean
  onToggleSettings: () => void
  sidebarVisible: boolean
  onToggleSidebar: () => void
}

export function ResearchChatHeader({
  title,
  settingsOpen,
  onToggleSettings,
  sidebarVisible,
  onToggleSidebar,
}: ResearchChatHeaderProps) {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b border-ledger-gray-200 bg-white flex-shrink-0">
      {/* Left: sidebar toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-10 text-ledger-gray-500 hover:text-ledger-black hidden md:flex p-0"
        onClick={onToggleSidebar}
        title={sidebarVisible ? 'Hide sessions' : 'Show sessions'}
      >
        {sidebarVisible ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeft className="h-5 w-5" />
        )}
      </Button>
      <div className="w-10 md:hidden" />

      {/* Center: title */}
      <h2 className="text-sm font-medium text-ledger-black truncate max-w-[50%]">
        {title}
      </h2>

      {/* Right: settings toggle */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-10 w-10 ${settingsOpen ? 'text-ledger-black' : 'text-ledger-gray-500'} hover:text-ledger-black p-0`}
        onClick={onToggleSettings}
        title={settingsOpen ? 'Hide settings' : 'Show settings'}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  )
}

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { MessageSquare, FileText, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceTab } from '@/types'

interface WorkspaceTabsProps {
  activeTab: WorkspaceTab
  onTabChange: (tab: WorkspaceTab) => void
  children: React.ReactNode
}

interface TabConfig {
  id: WorkspaceTab
  label: string
  icon: React.ReactNode
}

const TABS: TabConfig[] = [
  { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'drafts', label: 'Drafts', icon: <FileText className="h-4 w-4" /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote className="h-4 w-4" /> },
]

export function WorkspaceTabs({ activeTab, onTabChange, children }: WorkspaceTabsProps) {
  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={(value) => onTabChange(value as WorkspaceTab)}
      className="flex flex-col h-full"
    >
      {/* Tab List - Horizontal */}
      <TabsPrimitive.List className="flex items-center gap-1 px-1 py-1 bg-ledger-gray-100 rounded-lg mb-4">
        {TABS.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
              'text-ledger-gray-600 hover:text-ledger-black',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ledger-black focus-visible:ring-offset-2',
              'data-[state=active]:bg-ledger-white data-[state=active]:text-ledger-black data-[state=active]:shadow-sm'
            )}
          >
            {tab.icon}
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">{children}</div>
    </TabsPrimitive.Root>
  )
}

export function WorkspaceTabContent({
  value,
  children,
}: {
  value: WorkspaceTab
  children: React.ReactNode
}) {
  return (
    <TabsPrimitive.Content value={value} className="h-full focus:outline-none">
      {children}
    </TabsPrimitive.Content>
  )
}

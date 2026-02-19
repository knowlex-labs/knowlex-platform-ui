import { X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceTabItem } from '@/types'

interface WorkspaceTabBarProps {
  tabs: WorkspaceTabItem[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
}

export function WorkspaceTabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}: WorkspaceTabBarProps) {
  return (
    <div className="flex items-center border-b border-ledger-gray-200 bg-ledger-gray-50 px-2 pt-1">
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer border-b-2 transition-colors',
              activeTabId === tab.id
                ? 'border-kx-primary-600 text-kx-primary-700 bg-ledger-white font-medium'
                : 'border-transparent text-ledger-gray-500 hover:text-kx-primary-700'
            )}
            onClick={() => onTabClick(tab.id)}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{tab.label}</span>
            {tab.isUnsaved && (
              <span className="ml-1 text-amber-500 font-bold text-lg leading-none">*</span>
            )}
            <button
              className="ml-1 p-0.5 rounded hover:bg-ledger-gray-200 opacity-40 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

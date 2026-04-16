import { useState, useRef, useCallback, useEffect } from 'react'
import { X, FileText, PenLine, BookOpen, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceTabItem } from '@knowlex/core/types'

function getTabIcon(tab: WorkspaceTabItem) {
  switch (tab.type) {
    case 'draft': return PenLine
    case 'summary': return BookOpen
    case 'judgment': return Scale
    default: return FileText
  }
}

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(checkScroll)
    observer.observe(el)
    return () => observer.disconnect()
  }, [checkScroll, tabs.length])

  return (
    <div className="relative flex items-center border-b border-ledger-gray-200 bg-ledger-gray-50 px-2 pt-1">
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-ledger-gray-50 to-transparent z-10 pointer-events-none" />
      )}
      <div
        ref={scrollRef}
        className="flex items-center gap-0.5 overflow-x-auto scrollbar-none"
        onScroll={checkScroll}
      >
        {tabs.map((tab) => {
          const TabIcon = getTabIcon(tab)
          return (
            <div
              key={tab.id}
              className={cn(
                'group flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer border-b-2 transition-colors flex-shrink-0',
                activeTabId === tab.id
                  ? 'border-kx-primary-600 text-kx-primary-700 bg-ledger-white font-medium'
                  : 'border-transparent text-ledger-gray-500 hover:text-kx-primary-700'
              )}
              onClick={() => onTabClick(tab.id)}
            >
              <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate max-w-[200px]">{tab.label}</span>
              {tab.isUnsaved && (
                <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />
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
          )
        })}
      </div>
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-ledger-gray-50 to-transparent z-10 pointer-events-none" />
      )}
    </div>
  )
}

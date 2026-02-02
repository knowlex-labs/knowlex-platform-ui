import { useState, useCallback } from 'react'
import type { WorkspaceTabItem, Draft } from '@/types'

const CHAT_TAB: WorkspaceTabItem = {
  id: 'chat',
  type: 'chat',
  label: 'Chat',
}

interface UseWorkspaceTabsResult {
  tabs: WorkspaceTabItem[]
  activeTabId: string
  splitMode: boolean
  openTab: (draft: Draft) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  toggleSplitMode: () => void
  getActiveDraft: () => Draft | null
  activeDraftTab: WorkspaceTabItem | null
}

export function useWorkspaceTabs(drafts: Draft[]): UseWorkspaceTabsResult {
  const [tabs, setTabs] = useState<WorkspaceTabItem[]>([CHAT_TAB])
  const [activeTabId, setActiveTabId] = useState<string>('chat')
  const [splitMode, setSplitMode] = useState(false)

  const openTab = useCallback((draft: Draft) => {
    setTabs((prev) => {
      // Check if tab already exists
      const existing = prev.find((t) => t.draftId === draft.id)
      if (existing) {
        setActiveTabId(existing.id)
        return prev
      }

      // Add new tab
      const newTab: WorkspaceTabItem = {
        id: `draft-${draft.id}`,
        type: 'draft',
        label: draft.title.length > 20 ? draft.title.slice(0, 20) + '...' : draft.title,
        draftId: draft.id,
      }
      setActiveTabId(newTab.id)
      return [...prev, newTab]
    })
  }, [])

  const closeTab = useCallback((tabId: string) => {
    // Cannot close chat tab
    if (tabId === 'chat') return

    setTabs((prev) => {
      const tabIndex = prev.findIndex((t) => t.id === tabId)
      const newTabs = prev.filter((t) => t.id !== tabId)

      // If closing active tab, switch to previous tab or chat
      setActiveTabId((currentActive) => {
        if (currentActive === tabId) {
          // Try to switch to previous tab, otherwise chat
          if (tabIndex > 0) {
            return newTabs[tabIndex - 1]?.id || 'chat'
          }
          return 'chat'
        }
        return currentActive
      })

      return newTabs
    })
  }, [])

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const toggleSplitMode = useCallback(() => {
    setSplitMode((prev) => !prev)
  }, [])

  const getActiveDraft = useCallback((): Draft | null => {
    const activeTab = tabs.find((t) => t.id === activeTabId)
    if (activeTab?.type === 'draft' && activeTab.draftId) {
      return drafts.find((d) => d.id === activeTab.draftId) || null
    }
    return null
  }, [tabs, activeTabId, drafts])

  // Find the first draft tab (for split mode)
  const activeDraftTab = tabs.find((t) => t.type === 'draft') || null

  return {
    tabs,
    activeTabId,
    splitMode,
    openTab,
    closeTab,
    setActiveTab,
    toggleSplitMode,
    getActiveDraft,
    activeDraftTab,
  }
}

import { useState, useCallback, useEffect } from 'react'
import type { WorkspaceTabItem, Draft } from '@/types'

const SUMMARY_TAB_ID = 'summary'

interface UseWorkspaceTabsResult {
  tabs: WorkspaceTabItem[]
  activeTabId: string
  openTab: (draft: Draft) => void
  openSummaryTab: () => void
  closeSummaryTab: () => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  getActiveDraft: () => Draft | null
  activeDraftTab: WorkspaceTabItem | null
  setTabDirty: (tabId: string, isDirty: boolean) => void
}

export function useWorkspaceTabs(drafts: Draft[]): UseWorkspaceTabsResult {
  const [tabs, setTabs] = useState<WorkspaceTabItem[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')

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
    setTabs((prev) => {
      const tabIndex = prev.findIndex((t) => t.id === tabId)
      const newTabs = prev.filter((t) => t.id !== tabId)

      // If closing active tab, switch to previous tab or empty
      setActiveTabId((currentActive) => {
        if (currentActive === tabId) {
          if (tabIndex > 0) {
            return newTabs[tabIndex - 1]?.id || ''
          }
          return newTabs[0]?.id || ''
        }
        return currentActive
      })

      return newTabs
    })
  }, [])

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const getActiveDraft = useCallback((): Draft | null => {
    const activeTab = tabs.find((t) => t.id === activeTabId)
    if (activeTab?.type === 'draft' && activeTab.draftId) {
      return drafts.find((d) => d.id === activeTab.draftId) || null
    }
    return null
  }, [tabs, activeTabId, drafts])

  // Find the first draft tab
  const activeDraftTab = tabs.find((t) => t.type === 'draft') || null

  // Sync tab labels when drafts change (e.g. placeholder → final title after generation)
  useEffect(() => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.type !== 'draft' || !tab.draftId) return tab
        const draft = drafts.find((d) => d.id === tab.draftId)
        if (!draft) return tab
        const newLabel = draft.title.length > 20 ? draft.title.slice(0, 20) + '...' : draft.title
        if (tab.label === newLabel) return tab
        return { ...tab, label: newLabel }
      })
    )
  }, [drafts])

  // Update tab draftIds when placeholder IDs are replaced with real job IDs
  useEffect(() => {
    setTabs((prev) => {
      let changed = false
      const updated = prev.map((tab) => {
        if (tab.type !== 'draft' || !tab.draftId) return tab
        const stillExists = drafts.some((d) => d.id === tab.draftId)
        if (stillExists) return tab
        // Find a draft whose ID changed (placeholder → real)
        const tabDraftIds = new Set(prev.filter((t) => t.type === 'draft').map((t) => t.draftId))
        const untracked = drafts.find((d) => !tabDraftIds.has(d.id))
        if (untracked) {
          const oldTabId = tab.id
          const newTabId = `draft-${untracked.id}`
          changed = true
          // Also update activeTabId if this was the active tab
          setActiveTabId((currentActive) =>
            currentActive === oldTabId ? newTabId : currentActive
          )
          return { ...tab, id: newTabId, draftId: untracked.id }
        }
        return tab
      })
      return changed ? updated : prev
    })
  }, [drafts])

  const openSummaryTab = useCallback(() => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === SUMMARY_TAB_ID)
      if (existing) {
        setActiveTabId(SUMMARY_TAB_ID)
        return prev
      }
      const summaryTab: WorkspaceTabItem = {
        id: SUMMARY_TAB_ID,
        type: 'summary',
        label: 'Summary',
      }
      setActiveTabId(SUMMARY_TAB_ID)
      return [...prev, summaryTab]
    })
  }, [])

  const closeSummaryTab = useCallback(() => {
    closeTab(SUMMARY_TAB_ID)
  }, [closeTab])

  const setTabDirty = useCallback((tabId: string, isDirty: boolean) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, isUnsaved: isDirty } : t))
    )
  }, [])

  return {
    tabs,
    activeTabId,
    openTab,
    openSummaryTab,
    closeSummaryTab,
    closeTab,
    setActiveTab,
    getActiveDraft,
    activeDraftTab,
    setTabDirty,
  }
}

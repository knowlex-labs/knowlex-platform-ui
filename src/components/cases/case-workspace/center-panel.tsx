import { useCallback } from 'react'
import { WorkspaceTabBar } from './workspace-tab-bar'
import { ChatInterface } from './chat-interface'
import { DraftPreviewTab } from './draft-preview-tab'
import type { WorkspaceTabItem, WorkspaceMessage, Draft } from '@/types'

interface CenterPanelProps {
  tabs: WorkspaceTabItem[]
  activeTabId: string
  splitMode: boolean
  messages: WorkspaceMessage[]
  isLoading: boolean
  selectedSourceCount: number
  drafts: Draft[]
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onToggleSplit: () => void
  onSendMessage: (query: string) => Promise<void>
  onClearChat: () => void
  onSaveDraftLocal: (id: string, title: string, content: string) => void
  onSaveDraftToBackend: (id: string, title: string, content: string) => void | Promise<void>
  onDeleteDraft: (id: string) => void | Promise<void>
  onTabDirtyChange: (tabId: string, isDirty: boolean) => void
}

export function CenterPanel({
  tabs,
  activeTabId,
  splitMode,
  messages,
  isLoading,
  selectedSourceCount,
  drafts,
  onTabClick,
  onTabClose,
  onToggleSplit,
  onSendMessage,
  onClearChat,
  onSaveDraftLocal,
  onSaveDraftToBackend,
  onDeleteDraft,
  onTabDirtyChange,
}: CenterPanelProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const hasDraftTabs = tabs.some((t) => t.type === 'draft')

  // Find the active draft for preview
  const activeDraft = activeTab?.draftId
    ? drafts.find((d) => d.id === activeTab.draftId)
    : null

  // For split mode, find the first draft tab
  const firstDraftTab = tabs.find((t) => t.type === 'draft')
  const splitDraft = firstDraftTab?.draftId
    ? drafts.find((d) => d.id === firstDraftTab.draftId)
    : null

  const handleSendToChat = (text: string) => {
    onSendMessage(text)
    // Switch to chat tab if in split mode, focus stays on chat
    if (!splitMode) {
      onTabClick('chat')
    }
  }

  // Memoize the dirty handlers to prevent infinite loops in DraftPreviewTab
  // These dependencies are critical - we only want to recreate if IDs change
  const handleSplitDirtyChange = useCallback((isDirty: boolean) => {
    if (splitDraft && firstDraftTab) {
      onTabDirtyChange(firstDraftTab.id, isDirty)
    }
  }, [splitDraft?.id, firstDraftTab?.id, onTabDirtyChange])

  const handleActiveDirtyChange = useCallback((isDirty: boolean) => {
    if (activeTab) {
      onTabDirtyChange(activeTab.id, isDirty)
    }
  }, [activeTab?.id, onTabDirtyChange])

  return (
    <div className="flex flex-col h-full bg-kx-card overflow-hidden">
      {/* Tab Bar */}
      <WorkspaceTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        splitMode={splitMode}
        hasDraftTabs={hasDraftTabs}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        onToggleSplit={onToggleSplit}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {splitMode && hasDraftTabs ? (
          // Split View: Chat + Draft side by side
          <div className="flex h-full">
            {/* Chat Side */}
            <div className="flex-1 border-r border-ledger-gray-200 overflow-hidden">
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                selectedSourceCount={selectedSourceCount}
                onSendMessage={onSendMessage}
                onClearChat={onClearChat}
              />
            </div>

            {/* Draft Side */}
            <div className="flex-1 overflow-hidden">
              {splitDraft ? (
                <DraftPreviewTab
                  draft={splitDraft}
                  onSaveLocal={onSaveDraftLocal}
                  onSaveToBackend={onSaveDraftToBackend}
                  onDelete={onDeleteDraft}
                  onSendToChat={handleSendToChat}
                  onDirtyChange={handleSplitDirtyChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-ledger-gray-500">
                  Select a draft to preview
                </div>
              )}
            </div>
          </div>
        ) : (
          // Single View: Show active tab content
          <div className="h-full overflow-hidden">
            {activeTab?.type === 'chat' ? (
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                selectedSourceCount={selectedSourceCount}
                onSendMessage={onSendMessage}
                onClearChat={onClearChat}
              />
            ) : activeDraft ? (
              <DraftPreviewTab
                draft={activeDraft}
                onSaveLocal={onSaveDraftLocal}
                onSaveToBackend={onSaveDraftToBackend}
                onDelete={onDeleteDraft}
                onSendToChat={handleSendToChat}
                onDirtyChange={handleActiveDirtyChange}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-ledger-gray-500">
                Select a tab
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useCallback } from 'react'
import { ExternalLink } from 'lucide-react'
import { WorkspaceTabBar } from './workspace-tab-bar'
import { WorkspaceLanding } from './workspace-landing'
import { DraftPreviewTab } from './draft-preview-tab'
import { SummaryView } from './summary-view'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { WorkspaceTabItem, Draft, CaseSummary } from '@/types'

interface CenterPanelProps {
  tabs: WorkspaceTabItem[]
  activeTabId: string
  drafts: Draft[]
  caseId: string
  summary: CaseSummary | null
  isGeneratingSummary: boolean
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onSaveDraftLocal: (id: string, title: string, content: string) => void
  onSaveDraftToBackend: (id: string, title: string, content: string) => void | Promise<void>
  onDeleteDraft: (id: string) => void | Promise<void>
  onRetryDraft?: (draftId: string) => void
  onTabDirtyChange: (tabId: string, isDirty: boolean) => void
  onDraftingClick: () => void
  onSummaryClick: () => void
  onUploadDocumentsClick: () => void
  onLinkJudgmentClick: () => void
  onSendToChat: (text: string) => void
  onGenerateSummary: () => void
  onDeleteSummary: () => void
  /** When true, skips landing page — used when rendered in the right panel */
  compact?: boolean
}

export function CenterPanel({
  tabs,
  activeTabId,
  drafts,
  caseId,
  summary,
  isGeneratingSummary,
  onTabClick,
  onTabClose,
  onSaveDraftLocal,
  onSaveDraftToBackend,
  onDeleteDraft,
  onRetryDraft,
  onTabDirtyChange,
  onDraftingClick,
  onSummaryClick,
  onUploadDocumentsClick,
  onLinkJudgmentClick,
  onSendToChat,
  onGenerateSummary,
  onDeleteSummary,
  compact = false,
}: CenterPanelProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null)

  // Find the active draft for preview
  const activeDraft = activeTab?.draftId
    ? drafts.find((d) => d.id === activeTab.draftId)
    : null

  const handleActiveDirtyChange = useCallback((isDirty: boolean) => {
    if (activeTab) {
      onTabDirtyChange(activeTab.id, isDirty)
    }
  }, [activeTab?.id, onTabDirtyChange])

  // Intercept tab close — check for unsaved changes
  const handleTabClose = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId)
    if (tab?.isUnsaved) {
      setPendingCloseTabId(tabId)
    } else {
      onTabClose(tabId)
    }
  }, [tabs, onTabClose])

  // Save & Close the pending tab
  const handleSaveAndClose = useCallback(async () => {
    if (!pendingCloseTabId) return
    const tab = tabs.find((t) => t.id === pendingCloseTabId)
    if (tab?.draftId) {
      const draft = drafts.find((d) => d.id === tab.draftId)
      if (draft) {
        await onSaveDraftToBackend(draft.id, draft.title, draft.content)
      }
    }
    onTabClose(pendingCloseTabId)
    setPendingCloseTabId(null)
  }, [pendingCloseTabId, tabs, drafts, onSaveDraftToBackend, onTabClose])

  // Discard changes and close
  const handleDiscardAndClose = useCallback(() => {
    if (!pendingCloseTabId) return
    onTabClose(pendingCloseTabId)
    setPendingCloseTabId(null)
  }, [pendingCloseTabId, onTabClose])

  // Empty state — show landing with tool cards
  if (tabs.length === 0) {
    return (
      <div className="flex flex-col h-full bg-kx-card overflow-hidden">
        <WorkspaceLanding
          onDraftingClick={onDraftingClick}
          onSummaryClick={onSummaryClick}
          onUploadDocumentsClick={onUploadDocumentsClick}
          onLinkJudgmentClick={onLinkJudgmentClick}
          compact={compact}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-kx-card overflow-hidden">
      {/* Tab Bar */}
      <WorkspaceTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={onTabClick}
        onTabClose={handleTabClose}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab?.type === 'summary' ? (
          <SummaryView
            summary={summary}
            isGenerating={isGeneratingSummary}
            onRegenerate={onGenerateSummary}
            onDelete={onDeleteSummary}
          />
        ) : activeTab?.type === 'source' ? (
          <div className="flex flex-col h-full bg-ledger-gray-100">
            {(['PDF', 'JPG', 'JPEG', 'PNG'] as const).some((t) => t === activeTab.sourceFileType) ? (
              activeTab.sourceFileType === 'PDF' ? (
                <iframe
                  key={activeTab.sourceUrl}
                  src={activeTab.sourceUrl}
                  className="flex-1 w-full border-0"
                  title={activeTab.label}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <img
                    src={activeTab.sourceUrl}
                    alt={activeTab.label}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ledger-gray-500">
                <p className="text-sm">Preview not available for this file type.</p>
                <Button variant="outline" size="sm" onClick={() => window.open(activeTab.sourceUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open file
                </Button>
              </div>
            )}
          </div>
        ) : activeDraft ? (
          <DraftPreviewTab
            key={activeDraft.id}
            draft={activeDraft}
            caseId={caseId}
            onSaveLocal={onSaveDraftLocal}
            onSaveToBackend={onSaveDraftToBackend}
            onDelete={onDeleteDraft}
            onSendToChat={onSendToChat}
            onDirtyChange={handleActiveDirtyChange}
            onRetry={onRetryDraft}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-ledger-gray-500">
            Select a tab
          </div>
        )}
      </div>

      {/* Unsaved changes confirmation dialog */}
      <Dialog open={!!pendingCloseTabId} onOpenChange={(open) => { if (!open) setPendingCloseTabId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Would you like to save before closing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setPendingCloseTabId(null)}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleDiscardAndClose} className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
              Discard
            </Button>
            <Button size="sm" onClick={handleSaveAndClose} className="bg-kx-primary-600 hover:bg-kx-primary-700">
              Save & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

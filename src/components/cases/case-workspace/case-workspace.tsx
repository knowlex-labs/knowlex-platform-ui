import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, PanelRightClose, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams, useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { caseApi } from '@/services/api/case-api'
import { useCaseDocuments } from '@/hooks/use-case-sources'
import { useDraftChat } from '@/hooks/use-draft-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { useSummary } from '@/hooks/use-summary'
import { useWorkspaceTabs } from '@/hooks/use-workspace-tabs'
import { LeftSidebar } from './left-sidebar'
import { CenterPanel } from './center-panel'
import { DraftChatPanel } from './draft-chat-panel'
import { ModeToggle } from './mode-toggle'
import type { WorkspaceMode } from './mode-toggle'
import { HeaderToolButtons } from './header-tool-buttons'
import { AddSourceModal } from './add-source-modal'
import { TEMPLATE_TO_DOC_CONFIG } from './draft-creation-wizard'
import type { CreateDraftRequest, DocumentType } from '@/services/api/document-types'
import type { Draft, CaseDocument } from '@/types'
import { IndexingStatus } from '@/types'
import { toast } from '@/hooks/use-toast'

export function CaseWorkspace() {
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = caseIdParam!
  const navigate = useNavigate()
  const { setSidebarCollapsed } = useUIState()
  const [caseName, setCaseName] = useState('Case Workspace')
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('draft')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [showDraftWizard, setShowDraftWizard] = useState(false)
  const [addSourceModalOpen, setAddSourceModalOpen] = useState(false)

  // Resizable chat panel
  const MIN_CHAT_WIDTH = 320
  const MAX_CHAT_WIDTH = 700
  const DEFAULT_CHAT_WIDTH = 384 // w-96
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const isResizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(DEFAULT_CHAT_WIDTH)

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return
    const delta = startXRef.current - e.clientX
    const newWidth = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, startWidthRef.current + delta))
    setChatWidth(newWidth)
  }, [])

  const handleResizeEnd = useCallback(() => {
    isResizingRef.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }, [handleResizeMove])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }, [chatWidth, handleResizeMove, handleResizeEnd])

  const {
    documents,
    selectedSourceIds,
    isLoading: sourcesLoading,
    isUploading,
    toggleSourceSelection,
    selectAllSources,
    deselectAllSources,
    uploadFile,
    deleteSource,
    linkContent,
    renameDocument,
    refresh,
  } = useCaseDocuments(caseId)

  // Filter documents by type for display
  const sources = documents.filter(d => d.type === 'USER_UPLOADED')
  const judgments = documents.filter(d => d.type === 'JUDGMENT')
  const draftDocuments = documents.filter(d => d.type === 'DRAFT')

  // Count docs/judgments currently being indexed
  const indexingCount = documents.filter(d =>
    d.indexingStatus === IndexingStatus.PENDING ||
    d.indexingStatus === IndexingStatus.RUNNING
  ).length

  const {
    messages,
    isStreaming: chatStreaming,
    isLoadingHistory: chatLoadingHistory,
    sessions: chatSessions,
    activeSessionId,
    isLoadingSessions,
    settings: chatSettings,
    sendMessage: draftSendMessage,
    clearChat,
    deleteSession: deleteChatSession,
    selectSession,
    startNewChat,
    updateSettings: updateChatSettings,
  } = useDraftChat(caseId)

  // Draft management from useDrafts hook - includes polling and content fetching
  const {
    drafts,
    createDraft,
    updateDraftLocal,
    saveDraftToBackend,
    deleteDraft,
    fetchDraftContent,
  } = useDrafts(caseId, draftDocuments)

  const {
    tabs,
    activeTabId,
    openTab,
    openSummaryTab,
    closeSummaryTab,
    openSourceTab,
    closeTab,
    setActiveTab,
    setTabDirty,
  } = useWorkspaceTabs(drafts)

  const {
    summary,
    isLoading: isSummaryLoading,
    isGenerating: isGeneratingSummary,
    fetchSummary,
    generateSummary,
    deleteSummary,
  } = useSummary(caseId)

  // Auto-hide sidebar when workspace opens
  useEffect(() => {
    setSidebarCollapsed(true)
  }, [setSidebarCollapsed])

  // Fetch actual case name
  useEffect(() => {
    caseApi.getById(caseId).then((response) => {
      setCaseName(response.data.caseTitle ?? 'Case Workspace')
    }).catch(() => {
      // Keep default name on error
    })
  }, [caseId])

  const handleBack = () => {
    setSidebarCollapsed(false)
    navigate('/cases')
  }

  const handleSendMessage = async (query: string) => {
    await draftSendMessage(query, Array.from(selectedSourceIds))
  }

  const handleModeChange = (mode: WorkspaceMode) => {
    setWorkspaceMode(mode)
  }

  const handleSendToChat = (text: string) => {
    setRightPanelOpen(true)
    handleSendMessage(text)
  }

  const handleDraftClick = async (draft: Draft) => {
    if (!draft.content && draft.status === 'completed') {
      await fetchDraftContent(draft.id)
    }
    openTab(draft)
    setWorkspaceMode('draft')
  }

  const handleSaveDraftLocal = (id: string, title: string, content: string) => {
    updateDraftLocal(id, { title, content })
  }

  const handleSaveDraftToBackend = async (id: string, title: string, content: string) => {
    updateDraftLocal(id, { title, content })
    try {
      await saveDraftToBackend(id, title, content)
      toast({ title: 'Draft saved', variant: 'success' })
    } catch {
      toast({ title: 'Failed to save draft', variant: 'destructive' })
    }
  }

  const handleDeleteDraft = async (id: string) => {
    const tabId = `draft-${id}`
    closeTab(tabId)
    try {
      await deleteDraft(id)
      toast({ title: 'Draft deleted' })
    } catch {
      toast({ title: 'Failed to delete draft', variant: 'destructive' })
    }
  }

  // Called from header/landing Summary button — fetch first, generate only if nothing exists
  const handleSummaryClick = async () => {
    openSummaryTab()
    setWorkspaceMode('draft')
    if (summary && summary.status !== 'failed') return
    const existing = await fetchSummary()
    if (!existing || existing.status === 'failed') {
      generateSummary()
    }
  }

  // Called from SummaryView's Regenerate button — always triggers a new generation
  const handleGenerateSummary = () => {
    generateSummary()
    openSummaryTab()
  }

  const handleDeleteSummary = async () => {
    try {
      await deleteSummary()
      closeSummaryTab()
      toast({ title: 'Summary deleted' })
    } catch {
      toast({ title: 'Failed to delete summary', variant: 'destructive' })
    }
  }

  const handleRetryDraft = (draftId: string) => {
    const failedDraft = drafts.find((d) => d.id === draftId)
    if (!failedDraft) return

    // Determine document type from the failed draft's templateType
    const config = failedDraft.templateType
      ? TEMPLATE_TO_DOC_CONFIG[failedDraft.templateType] || { documentType: 'legal_notice' as DocumentType }
      : { documentType: 'legal_notice' as DocumentType }

    const request: CreateDraftRequest = {
      title: failedDraft.title,
      document_type: config.documentType,
      input_mode: 'freetext',
      subtype: config.subtype,
      freetext_body: `Re-generate: ${failedDraft.title}`,
    }

    // Delete the failed draft and create a new one
    handleDeleteDraft(draftId).then(() => {
      const pendingDraft = createDraft(request)
      openTab(pendingDraft)
    })
  }

  const handleUploadDocumentsClick = () => {
    setAddSourceModalOpen(true)
  }

  const handleLinkJudgment = () => {
    // TODO: Open judgment picker modal
    // For now, navigate to judgments page
    navigate('/judgments')
  }

  const handleOpenJudgmentInTab = (judgment: CaseDocument, url: string) => {
    openSourceTab(judgment, url)
    setWorkspaceMode('draft')
  }

  const handleDeleteJudgment = async (judgmentId: string) => {
    const tabId = `source-${judgmentId}`
    closeTab(tabId)
    try {
      await deleteSource(judgmentId)
      toast({ title: 'Judgment removed' })
    } catch {
      toast({ title: 'Failed to remove judgment', variant: 'destructive' })
    }
  }

  const handleReindexJudgment = async (judgmentId: string) => {
    await linkContent(judgmentId)
  }

  const handleDraftingClick = () => {
    setShowDraftWizard(true)
    setWorkspaceMode('draft')
  }

  const handleWizardGenerate = (request: CreateDraftRequest) => {
    const pendingDraft = createDraft(request)
    setShowDraftWizard(false)
    openTab(pendingDraft)
    setWorkspaceMode('draft')
  }

  const handleWizardCancel = () => {
    setShowDraftWizard(false)
  }

  return (
    <div className="h-screen flex flex-col bg-kx-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-kx-card-border bg-kx-card">
        {/* Left: Back + Case name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 h-8 px-3 text-ledger-gray-600 hover:text-kx-primary-700 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-4 w-px bg-ledger-gray-300 flex-shrink-0" />
          <h2 className="text-lg font-bold text-kx-primary-900 truncate">
            {caseName}
          </h2>
        </div>

        {/* Center: Mode toggle */}
        <div className="flex-shrink-0 mx-4">
          <ModeToggle mode={workspaceMode} onModeChange={handleModeChange} />
        </div>

        {/* Right: Tools + panel toggles */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          <HeaderToolButtons
            onDraftingClick={handleDraftingClick}
            onSummaryClick={handleSummaryClick}
            onUploadDocumentsClick={handleUploadDocumentsClick}
            onLinkJudgmentClick={handleLinkJudgment}
          />
          <div className="h-4 w-px bg-ledger-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className={leftPanelOpen ? 'h-8 w-8 p-0 text-ledger-gray-500 hover:text-kx-primary-700' : 'h-8 px-3 gap-1.5 text-ledger-gray-500 hover:text-kx-primary-700'}
            title={leftPanelOpen ? 'Hide left panel' : 'Show left panel'}
          >
            {leftPanelOpen
              ? <PanelLeftClose className="h-4 w-4" />
              : (
                <>
                  <PanelLeftOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">Files</span>
                </>
              )
            }
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={rightPanelOpen ? 'h-8 w-8 p-0 text-ledger-gray-500 hover:text-kx-primary-700' : 'h-8 px-3 gap-1.5 text-ledger-gray-500 hover:text-kx-primary-700'}
            title={rightPanelOpen ? 'Hide right panel' : 'Show right panel'}
          >
            {rightPanelOpen
              ? <PanelRightClose className="h-4 w-4" />
              : (
                <>
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {workspaceMode === 'draft' ? 'AI Chat' : 'Workspace'}
                  </span>
                </>
              )
            }
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden bg-kx-card">
        {leftPanelOpen && (
          <div className="w-72 flex-shrink-0 flex flex-col border-r border-kx-card-border overflow-hidden transition-all duration-200">
            <LeftSidebar
              sources={sources}
              apiDraftDocuments={draftDocuments}
              judgments={judgments}
              isJudgmentsLoading={sourcesLoading}
              selectedSourceIds={selectedSourceIds}
              isSourcesLoading={sourcesLoading}
              drafts={drafts}
              summary={summary}
              isSummaryLoading={isSummaryLoading}
              onToggleSourceSelection={toggleSourceSelection}
              onSelectAllSources={selectAllSources}
              onDeselectAllSources={deselectAllSources}
              onDeleteSource={deleteSource}
              onLinkContent={linkContent}
              onDraftClick={handleDraftClick}
              onDeleteDraft={handleDeleteDraft}
              onSummaryClick={handleSummaryClick}
              onDeleteSummary={handleDeleteSummary}
              onOpenSourceInTab={openSourceTab}
              onOpenJudgmentInTab={handleOpenJudgmentInTab}
              onDeleteJudgment={handleDeleteJudgment}
              onReindexJudgment={handleReindexJudgment}
              onRenameDocument={renameDocument}
            />
          </div>
        )}

        {/* Center: CenterPanel in draft mode, Chat in research mode */}
        <div className="flex-1 min-h-0 min-w-0">
          {workspaceMode === 'draft' ? (
            <CenterPanel
              tabs={tabs}
              activeTabId={activeTabId}
              drafts={drafts}
              summary={summary}
              isGeneratingSummary={isGeneratingSummary}
              onTabClick={setActiveTab}
              onTabClose={closeTab}
              onSaveDraftLocal={handleSaveDraftLocal}
              onSaveDraftToBackend={handleSaveDraftToBackend}
              onDeleteDraft={handleDeleteDraft}
              onRetryDraft={handleRetryDraft}
              onTabDirtyChange={setTabDirty}
              onDraftingClick={handleDraftingClick}
              onSummaryClick={handleSummaryClick}
              onUploadDocumentsClick={handleUploadDocumentsClick}
              onLinkJudgmentClick={handleLinkJudgment}
              onSendToChat={handleSendToChat}
              onGenerateSummary={handleGenerateSummary}
              onDeleteSummary={handleDeleteSummary}
              showDraftWizard={showDraftWizard}
              wizardSources={sources}
              wizardClient={undefined}
              onWizardGenerate={handleWizardGenerate}
              onWizardCancel={handleWizardCancel}
            />
          ) : (
            <DraftChatPanel
              messages={messages}
              isStreaming={chatStreaming}
              isLoadingHistory={chatLoadingHistory}
              sessions={chatSessions}
              activeSessionId={activeSessionId}
              isLoadingSessions={isLoadingSessions}
              selectedSourceCount={selectedSourceIds.size}
              indexingCount={indexingCount}
              settings={chatSettings}
              onSendMessage={handleSendMessage}
              onClearChat={clearChat}
              onDeleteSession={deleteChatSession}
              onSelectSession={selectSession}
              onUpdateSettings={updateChatSettings}
              onStartNewChat={startNewChat}
              showGreeting
            />
          )}
        </div>

        {/* Right: Chat in draft mode, CenterPanel in research mode */}
        {rightPanelOpen && (
          <>
            <div
              onMouseDown={handleResizeStart}
              className="w-1 flex-shrink-0 cursor-col-resize hover:bg-kx-primary-400/40 active:bg-kx-primary-500/50 transition-colors relative group"
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
            <div
              className="flex-shrink-0 flex flex-col border-l border-kx-card-border overflow-hidden"
              style={{ width: chatWidth }}
            >
              {workspaceMode === 'draft' ? (
                <DraftChatPanel
                  messages={messages}
                  isStreaming={chatStreaming}
                  isLoadingHistory={chatLoadingHistory}
                  sessions={chatSessions}
                  activeSessionId={activeSessionId}
                  isLoadingSessions={isLoadingSessions}
                  selectedSourceCount={selectedSourceIds.size}
                  indexingCount={indexingCount}
                  settings={chatSettings}
                  onSendMessage={handleSendMessage}
                  onClearChat={clearChat}
                  onDeleteSession={deleteChatSession}
                  onSelectSession={selectSession}
                  onUpdateSettings={updateChatSettings}
                  onStartNewChat={startNewChat}
                />
              ) : (
                <CenterPanel
                  compact
                  tabs={tabs}
                  activeTabId={activeTabId}
                  drafts={drafts}
                  summary={summary}
                  isGeneratingSummary={isGeneratingSummary}
                  onTabClick={setActiveTab}
                  onTabClose={closeTab}
                  onSaveDraftLocal={handleSaveDraftLocal}
                  onSaveDraftToBackend={handleSaveDraftToBackend}
                  onDeleteDraft={handleDeleteDraft}
                  onRetryDraft={handleRetryDraft}
                  onTabDirtyChange={setTabDirty}
                  onDraftingClick={handleDraftingClick}
                  onSummaryClick={handleSummaryClick}
                  onUploadDocumentsClick={handleUploadDocumentsClick}
                  onLinkJudgmentClick={handleLinkJudgment}
                  onSendToChat={handleSendToChat}
                  onGenerateSummary={handleGenerateSummary}
                  onDeleteSummary={handleDeleteSummary}
                />
              )}
            </div>
          </>
        )}
      </div>

      <AddSourceModal
        open={addSourceModalOpen}
        onOpenChange={setAddSourceModalOpen}
        onUpload={uploadFile}
        onRefresh={refresh}
        isUploading={isUploading}
      />
    </div>
  )
}

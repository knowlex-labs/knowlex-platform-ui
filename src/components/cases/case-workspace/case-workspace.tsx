import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, PanelRightClose, Bot, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams, useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { caseApi } from '@/services/api/case-api'
import { workspaceApi } from '@/services/api/workspace-api'
import { useCaseDocuments } from '@/hooks/use-case-sources'
import { useDraftChat } from '@/hooks/use-draft-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { useSummary } from '@/hooks/use-summary'
import { useWorkspaceTabs } from '@/hooks/use-workspace-tabs'
import { LeftSidebar } from './left-sidebar'
import { CenterPanel } from './center-panel'
import { DraftChatPanel } from './draft-chat-panel'
import { ResearchSidebar } from './research-sidebar'
import { ModeToggle } from './mode-toggle'
import type { WorkspaceMode } from './mode-toggle'
import { HeaderToolButtons } from './header-tool-buttons'
import { AddSourceModal } from './add-source-modal'
import { TEMPLATE_TO_DOC_CONFIG, DraftCreationWizard } from './draft-creation-wizard'
import { CaseDetailsModal } from './case-details-modal'
import type { CreateDraftRequest, DocumentType } from '@/services/api/document-types'
import type { Draft, CaseDocument, Client, BackendCase, UpdateCaseRequest, RespondentDetails } from '@/types'
import { IndexingStatus } from '@/types'
import { toast } from '@/hooks/use-toast'
import { mapBackendClient } from '@/services/mappers'

export function CaseWorkspace() {
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = caseIdParam!
  const navigate = useNavigate()
  const { setSidebarCollapsed } = useUIState()
  const [caseName, setCaseName] = useState('Case Workspace')
  const [caseData, setCaseData] = useState<BackendCase | null>(null)
  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitleValue, setEditingTitleValue] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  // Case details modal
  const [caseDetailsOpen, setCaseDetailsOpen] = useState(false)
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('research')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [showDraftWizard, setShowDraftWizard] = useState(false)
  const [wizardDraftId, setWizardDraftId] = useState<string | null>(null)
  const [addSourceModalOpen, setAddSourceModalOpen] = useState(false)

  // Case client (auto-fills first-party fields in draft wizard)
  const [caseClient, setCaseClient] = useState<Client | null>(null)
  useEffect(() => {
    caseApi.getClients(caseId).then((res) => {
      if (res.status === 'success' && res.data.length > 0) {
        setCaseClient(mapBackendClient(res.data[0]))
      }
    }).catch(() => {})
  }, [caseId])

  // Respondent details pre-fill string (populated from API on case load)
  const [respondentDetails, setRespondentDetails] = useState<string>('')

  const handleSaveRespondent = useCallback(async (details: string) => {
    setRespondentDetails(details)
    // Parse the plain string back to the respondentName for a quick save from the wizard
    await caseApi.updateRespondent(caseId, { respondentName: details.split(',')[0].trim() || details })
    toast({ title: 'Respondent saved', description: 'Will pre-fill in future drafts for this case.' })
  }, [caseId])

  // Resizable chat panel
  const MIN_CHAT_WIDTH = 320
  const MAX_CHAT_WIDTH = 700
  const DEFAULT_CHAT_WIDTH = 320
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

  // Fetch case data (title + respondent)
  const refreshCaseData = useCallback(() => {
    caseApi.getById(caseId).then((response) => {
      const data = response.data
      setCaseData(data)
      setCaseName(data.caseTitle ?? 'Case Workspace')
      // Pre-populate respondent from backend
      if (data.respondentName || data.respondentDetails) {
        const r = data.respondentDetails ?? {}
        const parts = [
          data.respondentName,
          r.addressLine1,
          r.addressLine2,
          r.city,
          r.state && r.pincode ? `${r.state} ${r.pincode}` : (r.state ?? r.pincode),
          r.phone,
          r.email,
          r.advocateName ? `Advocate: ${r.advocateName}` : undefined,
          r.notes,
        ].filter(Boolean)
        setRespondentDetails(parts.join(', '))
      }
    }).catch(() => {})
  }, [caseId])

  useEffect(() => { refreshCaseData() }, [refreshCaseData])

  const handleBack = () => {
    setSidebarCollapsed(false)
    navigate('/cases')
  }

  // Inline title editing
  const startEditingTitle = useCallback(() => {
    setEditingTitleValue(caseName)
    setIsEditingTitle(true)
    setTimeout(() => titleInputRef.current?.select(), 30)
  }, [caseName])

  const commitTitleEdit = useCallback(async () => {
    const newTitle = editingTitleValue.trim()
    setIsEditingTitle(false)
    if (!newTitle || newTitle === caseName) return
    setCaseName(newTitle)
    await caseApi.update(caseId, { caseTitle: newTitle })
    toast({ title: 'Case title updated' })
  }, [editingTitleValue, caseName, caseId])

  const cancelTitleEdit = useCallback(() => {
    setIsEditingTitle(false)
    setEditingTitleValue(caseName)
  }, [caseName])

  // Case details modal handlers
  const handleSaveCase = useCallback(async (data: UpdateCaseRequest) => {
    await caseApi.update(caseId, data)
    await refreshCaseData()
    toast({ title: 'Case details updated' })
  }, [caseId, refreshCaseData])

  const handleSaveRespondentFull = useCallback(async (name: string, details: RespondentDetails) => {
    await caseApi.updateRespondent(caseId, { respondentName: name, details })
    await refreshCaseData()
    toast({ title: 'Respondent details updated' })
  }, [caseId, refreshCaseData])

  const handleSendMessage = async (query: string, fileIds: string[] = []) => {
    await draftSendMessage(query, [...Array.from(selectedSourceIds), ...fileIds])
  }

  const handleUploadChatFile = async (file: File): Promise<string> => {
    const { id } = await workspaceApi.uploadDocument(caseId, file)
    return id
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
    const pendingDraft = createDraft(request, {
      // Sync real document id after POST — placeholder id is replaced in state and preview must track the same id
      onDocumentCreated: (documentId) => setWizardDraftId(documentId),
    })
    setWizardDraftId(pendingDraft.id)
    setWorkspaceMode('draft')
    // Wizard stays open — auto-advances to preview step
  }

  const handleWizardSave = () => {
    const draft = wizardDraftId ? drafts.find((d) => d.id === wizardDraftId) ?? null : null
    if (draft) {
      openTab(draft)
      setWorkspaceMode('draft')
    }
    setShowDraftWizard(false)
    setWizardDraftId(null)
    setRightPanelOpen(false)
  }

  const handleWizardDiscard = async (draftId: string) => {
    setWizardDraftId(null)
    try { await deleteDraft(draftId) } catch { /* ignore */ }
  }

  const handleWizardCancel = () => {
    setShowDraftWizard(false)
    setWizardDraftId(null)
  }

  return (
    <div className="h-screen flex flex-col bg-kx-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-kx-card-border bg-kx-card">
        {/* Left: Back + Case name (double-click to edit) + pencil */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 h-8 px-3 text-ledger-gray-600 hover:text-kx-primary-700 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-4 w-px bg-ledger-gray-300 flex-shrink-0" />

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <input
                ref={titleInputRef}
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitTitleEdit(); if (e.key === 'Escape') cancelTitleEdit() }}
                onBlur={commitTitleEdit}
                className="text-lg font-bold text-kx-primary-900 bg-white border border-kx-primary-400 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-kx-primary-500 min-w-[200px] max-w-[360px]"
                autoFocus
              />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); commitTitleEdit() }} className="h-6 w-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); cancelTitleEdit() }} className="h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:bg-ledger-gray-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 group">
              <h2
                className="text-lg font-bold text-kx-primary-900 truncate cursor-pointer select-none"
                onDoubleClick={startEditingTitle}
                title="Double-click to edit title"
              >
                {caseName}
              </h2>
              <button
                type="button"
                onClick={() => setCaseDetailsOpen(true)}
                className="h-6 w-6 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-primary-600 hover:bg-ledger-gray-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Edit case details"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Mode toggle */}
        <div className="flex-shrink-0 mx-4">
          <ModeToggle mode={workspaceMode} onModeChange={handleModeChange} />
        </div>

        {/* Right: Tools + panel toggles */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          {workspaceMode === 'draft' && (
            <>
              <HeaderToolButtons
                onDraftingClick={handleDraftingClick}
                onSummaryClick={handleSummaryClick}
                onUploadDocumentsClick={handleUploadDocumentsClick}
                onLinkJudgmentClick={handleLinkJudgment}
              />
              <div className="h-4 w-px bg-ledger-gray-300 mx-1" />
            </>
          )}
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
                  <span className="text-sm font-medium">{workspaceMode === 'research' ? 'Chats' : 'Files'}</span>
                </>
              )
            }
          </Button>
          {workspaceMode === 'draft' && (
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
                    <span className="text-sm font-medium">AI Chat</span>
                  </>
                )
              }
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden bg-kx-card">
        {leftPanelOpen && (
          <div className={`${workspaceMode === 'research' ? 'w-56' : 'w-60'} flex-shrink-0 flex flex-col border-r border-kx-card-border overflow-hidden transition-all duration-200`}>
            {workspaceMode === 'research' ? (
              <ResearchSidebar
                sessions={chatSessions}
                activeSessionId={activeSessionId}
                isLoadingSessions={isLoadingSessions}
                onSelectSession={selectSession}
                onStartNewChat={startNewChat}
                onDeleteSession={deleteChatSession}
              />
            ) : (
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
                onRenameDraft={renameDocument}
              />
            )}
          </div>
        )}

        {/* Center */}
        <div className="flex-1 min-h-0 min-w-0">
          {workspaceMode === 'draft' ? (
            <CenterPanel
              tabs={tabs}
              activeTabId={activeTabId}
              drafts={drafts}
              caseId={caseId}
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
          ) : (
            <DraftChatPanel
              messages={messages}
              isStreaming={chatStreaming}
              isLoadingHistory={chatLoadingHistory}
              sessions={chatSessions}
              activeSessionId={activeSessionId}
              isLoadingSessions={isLoadingSessions}
              indexingCount={indexingCount}
              settings={chatSettings}
              onSendMessage={handleSendMessage}
              onUploadFile={handleUploadChatFile}
              onClearChat={clearChat}
              onDeleteSession={deleteChatSession}
              onSelectSession={selectSession}
              onUpdateSettings={updateChatSettings}
              onStartNewChat={startNewChat}
              showGreeting
              isResearchMode
            />
          )}
        </div>

        {/* Right: Chat panel — draft mode only */}
        {workspaceMode === 'draft' && rightPanelOpen && (
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
              <DraftChatPanel
                messages={messages}
                isStreaming={chatStreaming}
                isLoadingHistory={chatLoadingHistory}
                sessions={chatSessions}
                activeSessionId={activeSessionId}
                isLoadingSessions={isLoadingSessions}
                indexingCount={indexingCount}
                settings={chatSettings}
                onSendMessage={handleSendMessage}
                onUploadFile={handleUploadChatFile}
                onClearChat={clearChat}
                onDeleteSession={deleteChatSession}
                onSelectSession={selectSession}
                onUpdateSettings={updateChatSettings}
                onStartNewChat={startNewChat}
              />
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

      <CaseDetailsModal
        open={caseDetailsOpen}
        onOpenChange={setCaseDetailsOpen}
        caseData={caseData}
        onSaveCase={handleSaveCase}
        onSaveRespondent={handleSaveRespondentFull}
      />

      {showDraftWizard && (
        <div className="fixed inset-0 left-16 z-50 flex items-stretch">
          <DraftCreationWizard
            sources={sources}
            judgments={judgments}
            client={caseClient}
            respondentDetails={respondentDetails}
            onSaveRespondent={handleSaveRespondent}
            onGenerate={handleWizardGenerate}
            onSave={handleWizardSave}
            onDiscard={handleWizardDiscard}
            onCancel={handleWizardCancel}
            previewDraft={wizardDraftId ? (drafts.find((d) => d.id === wizardDraftId) ?? null) : null}
          />
        </div>
      )}
    </div>
  )
}

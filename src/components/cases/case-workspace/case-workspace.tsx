import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, PanelLeftOpen, PanelRightOpen,
  Check, X, Pencil, Scale, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams, useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { caseApi } from '@/services/api/case-api'
import { workspaceApi } from '@/services/api/workspace-api'
import { useCaseDocuments } from '@/hooks/use-case-sources'
import { useDraftChat } from '@/hooks/use-draft-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { useSummary } from '@/hooks/use-summary'
import { DraftChatPanel } from './draft-chat-panel'
import { AddSourceModal } from './add-source-modal'
import { OnlyOfficeEditor } from './onlyoffice-editor'
import { CaseDetailsModal } from './case-details-modal'
import { WorkspaceSourcesPanel } from './workspace-sources-panel'
import { CaseStudioPanel } from './case-studio-panel'
import type { CaseDocument, BackendCase, UpdateCaseRequest, RespondentDetails } from '@/types'
import { DocumentType, IndexingStatus } from '@/types'
import { toast } from '@/hooks/use-toast'
import { mapBackendClient } from '@/services/mappers'

export function CaseWorkspace() {
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = caseIdParam!
  const navigate = useNavigate()
  const { setSidebarCollapsed } = useUIState()

  // ── Case metadata ──
  const [caseName, setCaseName] = useState('Case Workspace')
  const [caseSubtitle, setCaseSubtitle] = useState<string>('')
  const [caseData, setCaseData] = useState<BackendCase | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitleValue, setEditingTitleValue] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [caseDetailsOpen, setCaseDetailsOpen] = useState(false)

  // ── Panel visibility ──
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [studioOpen, setStudioOpen] = useState(true)

  // ── Modals / editors ──
  const [addSourceModalOpen, setAddSourceModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<CaseDocument | null>(null)

  // Auto-collapse global sidebar
  useEffect(() => { setSidebarCollapsed(true) }, [setSidebarCollapsed])

  // ── Data hooks ──
  const {
    documents,
    paginatedSources,
    isSourcesLoading,
    isUploading,
    deleteSource,
    renameDocument,
    uploadFile,
    refresh,
    selectedSourceIds,
    toggleSourceSelection,
    selectAllSources,
    deselectAllSources,
  } = useCaseDocuments(caseId)

  const sources = paginatedSources
  const draftDocuments = documents.filter(d => d.type === DocumentType.DRAFT)

  const indexingCount = [...paginatedSources, ...documents].filter(d =>
    d.indexingStatus === IndexingStatus.PENDING || d.indexingStatus === IndexingStatus.RUNNING
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
    renameSession,
  } = useDraftChat(caseId)

  const {
    drafts,
    deleteDraft,
  } = useDrafts(caseId, draftDocuments)

  const {
    summary,
    isLoading: isSummaryLoading,
    fetchSummary,
    generateSummary,
  } = useSummary(caseId)

  // ── Case data loading ──
  const refreshCaseData = useCallback(() => {
    caseApi.getById(caseId).then((response) => {
      const data = response.data
      setCaseData(data)
      setCaseName(data.caseTitle ?? 'Case Workspace')
      // Build subtitle from caseNumber + courtName
      const parts = [data.caseNumber, data.courtName].filter(Boolean)
      setCaseSubtitle(parts.join(' • '))
    }).catch(() => {})
  }, [caseId])

  useEffect(() => { refreshCaseData() }, [refreshCaseData])

  // ── Navigation ──
  const handleBack = () => {
    setSidebarCollapsed(false)
    navigate('/cases')
  }

  // ── Inline title editing ──
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

  // ── Case details ──
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

  // ── Chat ──
  const handleSendMessage = async (query: string, fileIds: string[] = []) => {
    await draftSendMessage(query, [...Array.from(selectedSourceIds), ...fileIds])
  }

  const handleUploadChatFile = async (file: File): Promise<string> => {
    const { id } = await workspaceApi.uploadDocument(caseId, file)
    return id
  }

  // ── Studio actions ──
  const handleGenerateSummary = async () => {
    if (summary && summary.status !== 'failed') return
    const existing = await fetchSummary()
    if (!existing || existing.status === 'failed') generateSummary()
  }

  const handleFindPrecedents = () => navigate('/ai-research')

  // ── Draft management ──
  const handleDeleteDraft = async (id: string) => {
    try {
      await deleteDraft(id)
      toast({ title: 'Draft deleted' })
    } catch {
      toast({ title: 'Failed to delete draft', variant: 'destructive' })
    }
  }

  const handleRenameDraft = async (id: string, title: string) => {
    await renameDocument(id, title)
  }

  // ── Caseload client for chat context (not needed in new design but keep for API compat) ──
  useEffect(() => {
    caseApi.getClients(caseId).then((res) => {
      if (res.status === 'success' && res.data.length > 0) {
        mapBackendClient(res.data[0])  // side-effect: available if needed
      }
    }).catch(() => {})
  }, [caseId])

  return (
    <div className="h-screen flex flex-col bg-kx-card overflow-hidden">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-kx-card-border bg-kx-card flex-shrink-0">
        {/* Left: Back + Case title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost" size="sm"
            onClick={handleBack}
            className="gap-1.5 h-8 px-3 text-ledger-gray-500 hover:text-kx-primary-700 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="h-4 w-px bg-ledger-gray-200 dark:bg-ledger-gray-700 flex-shrink-0" />

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                ref={titleInputRef}
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitTitleEdit(); if (e.key === 'Escape') cancelTitleEdit() }}
                onBlur={commitTitleEdit}
                className="flex-1 min-w-0 text-base font-semibold text-kx-primary-900 bg-white dark:bg-ledger-gray-800 border border-kx-primary-400 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
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
            <div className="group flex items-start gap-1.5 min-w-0">
              <div className="min-w-0">
                <h2
                  className="text-base font-semibold text-kx-primary-900 dark:text-kx-primary-100 truncate cursor-pointer select-none leading-snug"
                  onDoubleClick={startEditingTitle}
                  title="Double-click to edit"
                >
                  {caseName}
                </h2>
                {caseSubtitle && (
                  <p className="text-xs text-ledger-gray-400 truncate leading-snug">{caseSubtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={startEditingTitle}
                className="h-5 w-5 flex items-center justify-center rounded text-ledger-gray-400 hover:text-kx-primary-600 hover:bg-ledger-gray-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                title="Edit title"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: toggles */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Case details button */}
          <Button
            variant="ghost" size="sm"
            onClick={() => setCaseDetailsOpen(true)}
            className="h-8 px-2.5 gap-1.5 text-xs text-ledger-gray-500 hover:text-kx-primary-700"
          >
            <Scale className="h-3.5 w-3.5" />
            Case Details
          </Button>
        </div>
      </header>

      {/* ─── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Sources panel — full when open, icon strip when closed */}
        {leftPanelOpen ? (
          <div className="w-72 flex-shrink-0 border-r border-kx-card-border flex flex-col overflow-hidden min-h-0">
            <WorkspaceSourcesPanel
              sources={sources}
              isSourcesLoading={isSourcesLoading}
              drafts={drafts}
              summary={isSummaryLoading ? null : summary}
              selectedSourceIds={selectedSourceIds}
              onAddSource={() => setAddSourceModalOpen(true)}
              onDeleteSource={deleteSource}
              onRenameDocument={renameDocument}
              onDeleteDraft={handleDeleteDraft}
              onRenameDraft={handleRenameDraft}
              onToggleSource={toggleSourceSelection}
              onSelectAll={selectAllSources}
              onDeselectAll={deselectAllSources}
              onClose={() => setLeftPanelOpen(false)}
            />
          </div>
        ) : (
          <div className="w-12 flex-shrink-0 border-r border-kx-card-border flex flex-col items-center py-2 gap-1 overflow-hidden bg-kx-card">
            {/* Re-open button */}
            <button
              type="button"
              onClick={() => setLeftPanelOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border-2 border-kx-primary-400 bg-kx-primary-50 text-kx-primary-600 hover:bg-kx-primary-100 transition-colors flex-shrink-0"
              title="Show sources panel"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            {/* Source document icons */}
            <div className="flex flex-col items-center gap-1 mt-1 overflow-hidden flex-1 w-full px-1">
              {sources.slice(0, 12).map((doc) => {
                const ext = (doc.originalFilename || doc.name).split('.').pop()?.toUpperCase() || ''
                const isPdf = ext === 'PDF'
                const isDoc = ext === 'DOCX' || ext === 'DOC'
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setLeftPanelOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 transition-colors flex-shrink-0"
                    title={doc.originalFilename || doc.name}
                  >
                    <FileText className={`h-4 w-4 ${isPdf ? 'text-red-500' : isDoc ? 'text-blue-500' : 'text-ledger-gray-400'}`} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Center: AI Chat */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
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
            onRenameSession={renameSession}
            showGreeting
          />
        </div>

        {/* Right: Case Studio — full when open, icon strip when closed */}
        {studioOpen ? (
          <div className="w-72 flex-shrink-0 border-l border-kx-card-border flex flex-col overflow-hidden">
            <CaseStudioPanel
              onClose={() => setStudioOpen(false)}
              onGenerateSummary={handleGenerateSummary}
              onSendToChat={(msg) => handleSendMessage(msg)}
              onFindPrecedents={handleFindPrecedents}
              sourceCount={sources.length}
            />
          </div>
        ) : (
          <div className="w-12 flex-shrink-0 border-l border-kx-card-border flex flex-col items-center py-2 bg-kx-card">
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border-2 border-kx-primary-400 bg-kx-primary-50 text-kx-primary-600 hover:bg-kx-primary-100 transition-colors flex-shrink-0"
              title="Open Case Studio"
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────── */}
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

      {editingDocument && (
        <OnlyOfficeEditor
          documentId={editingDocument.id}
          caseId={caseId}
          onClose={() => setEditingDocument(null)}
        />
      )}
    </div>
  )
}

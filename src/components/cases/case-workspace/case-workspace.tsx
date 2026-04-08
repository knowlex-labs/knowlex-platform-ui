import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, PanelLeft, PanelRight,
  Check, X, Pencil, Scale, FileText, ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams, useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { caseApi } from '@/services/api/case-api'
import { workspaceApi } from '@/services/api/workspace-api'
import { config } from '@/config/env'
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

  // ── Left panel resize ──
  const DEFAULT_LEFT_WIDTH = 288
  const PREVIEW_LEFT_WIDTH = 480
  const MIN_LEFT_WIDTH = 200
  const MAX_LEFT_WIDTH = 500
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_WIDTH)
  const isResizingLeft = useRef(false)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  // ── Document preview in left panel ──
  const [previewingDoc, setPreviewingDoc] = useState<{ doc: CaseDocument; url: string; textContent?: string } | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingLeft.current) return
      e.preventDefault()
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const panelLeft = leftPanelRef.current?.getBoundingClientRect().left ?? 0
        const newWidth = Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, e.clientX - panelLeft))
        setLeftPanelWidth(newWidth)
      })
    }
    const handleMouseUp = () => {
      if (!isResizingLeft.current) return
      isResizingLeft.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleStartResize = useCallback(() => {
    isResizingLeft.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleDoubleClickDocument = useCallback(async (doc: CaseDocument) => {
    try {
      const url = await workspaceApi.resolveDocumentUrl({
        id: doc.id,
        downloadUrl: doc.downloadUrl ?? undefined,
        signedUrl: doc.signedUrl ?? undefined,
      })
      const ext = (doc.originalFilename || doc.name).split('.').pop()?.toLowerCase() || ''
      let textContent: string | undefined
      if (ext === 'md' || ext === 'txt') {
        try {
          const token = localStorage.getItem('auth_token')
          const userId = localStorage.getItem('auth_user_id')
          const headers: Record<string, string> = {}
          if (token) headers['Authorization'] = `Bearer ${token}`
          if (userId) headers['x-user-id'] = userId
          const res = await fetch(`${config.apiBaseUrl}/api/v1/documents/${doc.id}/download`, { headers })
          if (res.ok) textContent = await res.text()
        } catch {
          textContent = undefined
        }
      }
      setPreviewingDoc({ doc, url, textContent })
      setLeftPanelWidth(PREVIEW_LEFT_WIDTH)
    } catch {
      toast({ title: 'Could not preview file', variant: 'destructive' })
    }
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewingDoc(null)
    setLeftPanelWidth(DEFAULT_LEFT_WIDTH)
  }, [])

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


  return (
    <div className="h-full flex flex-col bg-nb-separator overflow-hidden">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-nb-panel-border bg-nb-panel flex-shrink-0">
        {/* Left: Back + Case title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost" size="sm"
            onClick={handleBack}
            className="gap-2 h-9 px-3 text-nb-text-muted hover:text-kx-primary-700 hover:bg-nb-sidebar-hover rounded-lg flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="h-5 w-px bg-nb-panel-border flex-shrink-0" />

          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                ref={titleInputRef}
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitTitleEdit(); if (e.key === 'Escape') cancelTitleEdit() }}
                onBlur={commitTitleEdit}
                className="flex-1 min-w-0 text-base font-semibold text-kx-primary-900 bg-nb-input border border-kx-primary-400 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
                autoFocus
              />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); commitTitleEdit() }} className="h-7 w-7 flex items-center justify-center rounded-md text-green-600 hover:bg-green-50">
                <Check className="h-4 w-4" />
              </button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); cancelTitleEdit() }} className="h-7 w-7 flex items-center justify-center rounded-md text-nb-text-muted hover:bg-nb-sidebar-hover">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="group flex items-start gap-2 min-w-0">
              <div className="min-w-0">
                <h1
                  className="text-lg font-bold text-kx-primary-900 truncate cursor-pointer select-none leading-snug"
                  onDoubleClick={startEditingTitle}
                  title="Double-click to edit"
                >
                  {caseName}
                </h1>
                {caseSubtitle && (
                  <p className="text-xs text-nb-text-muted truncate leading-snug mt-0.5">{caseSubtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={startEditingTitle}
                className="h-6 w-6 flex items-center justify-center rounded-md text-nb-text-muted hover:text-kx-primary-600 hover:bg-nb-sidebar-hover opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                title="Edit title"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: toggles */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost" size="sm"
            onClick={() => setCaseDetailsOpen(true)}
            className="h-9 px-3 gap-2 text-sm text-nb-text-muted hover:text-kx-primary-700 hover:bg-nb-sidebar-hover rounded-lg"
          >
            <Scale className="h-4 w-4" />
            Case Details
          </Button>
        </div>
      </header>

      {/* ─── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-nb-separator p-1.5 gap-1.5">
        {/* Left: Sources panel — full when open, icon strip when closed */}
        {leftPanelOpen ? (
          <>
            <div ref={leftPanelRef} className="flex-shrink-0 border border-nb-panel-border rounded-xl flex flex-col min-h-0 bg-nb-sidebar shadow-sm overflow-hidden" style={{ width: leftPanelWidth }}>
              {previewingDoc ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 px-3 py-3 border-b border-nb-panel-border flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleClosePreview}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-nb-text-muted hover:text-kx-text-primary hover:bg-nb-sidebar-hover transition-colors flex-shrink-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-kx-text-primary truncate">
                      {previewingDoc.doc.originalFilename || previewingDoc.doc.name}
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden bg-ledger-gray-50 dark:bg-ledger-gray-900">
                    {(() => {
                      const ext = (previewingDoc.doc.originalFilename || previewingDoc.doc.name).split('.').pop()?.toLowerCase() || ''
                      if (ext === 'pdf') {
                        return <iframe src={previewingDoc.url} className="w-full h-full border-0" title="Document preview" />
                      }
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                        return <img src={previewingDoc.url} alt="Preview" className="max-w-full max-h-full object-contain m-auto" />
                      }
                      if (previewingDoc.textContent !== undefined) {
                        return (
                          <pre className="w-full h-full overflow-auto p-4 text-xs text-kx-text-primary font-mono whitespace-pre-wrap break-words">
                            {previewingDoc.textContent}
                          </pre>
                        )
                      }
                      return (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-nb-text-muted">
                          <FileText className="h-8 w-8" />
                          <p className="text-xs">Preview not available</p>
                          <a href={previewingDoc.url} target="_blank" rel="noreferrer" className="text-xs text-kx-primary-600 hover:underline">Open file</a>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                <WorkspaceSourcesPanel
                  sources={sources}
                  isSourcesLoading={isSourcesLoading}
                  selectedSourceIds={selectedSourceIds}
                  onAddSource={() => setAddSourceModalOpen(true)}
                  onDeleteSource={deleteSource}
                  onRenameDocument={renameDocument}
                  onToggleSource={toggleSourceSelection}
                  onSelectAll={selectAllSources}
                  onDeselectAll={deselectAllSources}
                  onClose={() => setLeftPanelOpen(false)}
                  onDoubleClickDocument={handleDoubleClickDocument}
                />
              )}
            </div>
            {/* Resize handle */}
            <div
              className="w-1.5 flex-shrink-0 cursor-col-resize group/handle relative"
              onMouseDown={handleStartResize}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
              <div className="h-full w-full rounded-full" />
            </div>
          </>
        ) : (
          <div className="w-14 flex-shrink-0 border border-nb-panel-border rounded-xl flex flex-col items-center py-3 gap-2 overflow-y-auto bg-nb-sidebar shadow-sm">
            <button
              type="button"
              onClick={() => setLeftPanelOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border-2 border-kx-primary-400 bg-kx-primary-50 text-kx-primary-600 hover:bg-kx-primary-100 transition-colors flex-shrink-0"
              title="Show sources panel"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => { setLeftPanelOpen(true); setAddSourceModalOpen(true) }}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-nb-text-muted hover:text-kx-primary-600 hover:bg-nb-sidebar-hover transition-colors flex-shrink-0"
              title="Add source"
            >
              <span className="text-lg leading-none">+</span>
            </button>
            {sources.map((doc) => {
              const ext = (doc.originalFilename || doc.name).split('.').pop()?.toUpperCase() || ''
              const isPdf = ext === 'PDF'
              const isDoc = ext === 'DOCX' || ext === 'DOC'
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setLeftPanelOpen(true)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-nb-sidebar-hover transition-colors flex-shrink-0"
                  title={doc.originalFilename || doc.name}
                >
                  <FileText className={`h-4 w-4 ${isPdf ? 'text-red-500' : isDoc ? 'text-blue-500' : 'text-nb-text-muted'}`} />
                </button>
              )
            })}
          </div>
        )}

        {/* Center: AI Chat */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden border border-nb-panel-border rounded-xl bg-nb-panel shadow-sm">
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
          <div className="w-72 flex-shrink-0 border border-nb-panel-border rounded-xl flex flex-col overflow-hidden bg-nb-sidebar shadow-sm">
            <CaseStudioPanel
              onClose={() => setStudioOpen(false)}
              onGenerateSummary={handleGenerateSummary}
              onSendToChat={(msg) => handleSendMessage(msg)}
              onFindPrecedents={handleFindPrecedents}
              sourceCount={sources.length}
              caseId={caseId}
              drafts={drafts}
              summary={isSummaryLoading ? null : summary}
              onDeleteDraft={handleDeleteDraft}
              onRenameDraft={handleRenameDraft}
            />
          </div>
        ) : (
          <div className="w-14 flex-shrink-0 border border-nb-panel-border rounded-xl flex flex-col items-center py-3 bg-nb-sidebar shadow-sm">
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border-2 border-kx-primary-400 bg-kx-primary-50 text-kx-primary-600 hover:bg-kx-primary-100 transition-colors flex-shrink-0"
              title="Open Case Studio"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Footer disclaimer ────────────────────────────────────────── */}
      <div className="flex-shrink-0 py-1 text-center">
        <p className="text-[11px] text-nb-text-muted">
          Knowlex can be inaccurate; please double check its responses.
        </p>
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

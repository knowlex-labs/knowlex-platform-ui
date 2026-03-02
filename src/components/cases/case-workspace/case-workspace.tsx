import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams, useNavigate } from 'react-router-dom'
import { useUIState } from '@/contexts/ui-context'
import { caseApi } from '@/services/api/case-api'
import { mapBackendClient } from '@/services/mappers'
import { useCaseSources } from '@/hooks/use-case-sources'
import { useDraftChat } from '@/hooks/use-draft-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { useWorkspaceTabs } from '@/hooks/use-workspace-tabs'
import { LeftSidebar } from './left-sidebar'
import { CenterPanel } from './center-panel'
import { DraftChatPanel } from './draft-chat-panel'
import { HeaderToolButtons } from './header-tool-buttons'
import { TemplateFormModal } from './template-form-modal'
import type { CreateDraftRequest, DocumentType, Language } from '@/services/api/drafts-api'
import type { Draft, DraftTemplate, TemplateFormData, Client } from '@/types'
import { DRAFT_TEMPLATES } from '@/types'

// Maps each template to its API document_type and optional subtype
const TEMPLATE_TO_DOC_CONFIG: Record<string, { documentType: DocumentType; subtype?: string }> = {
  'notice': { documentType: 'legal_notice', subtype: 'demand' },
  'patent': { documentType: 'application' },
  'application-draft': { documentType: 'application', subtype: 'vakalatnama' },
  'interim-application': { documentType: 'affidavit', subtype: 'interim_application' },
  'affidavit': { documentType: 'affidavit', subtype: 'plaint' },
  'bail-application': { documentType: 'bail_application' },
  'criminal-appeal': { documentType: 'criminal_appeal' },
}

// Assembles template form fields into plain-language instructions for the AI
function assembleBody(templateId: string, formData: TemplateFormData): string {
  const get = (key: string): string => (formData[key] as string) || ''
  switch (templateId) {
    case 'notice':
      return `Draft a legal notice to ${get('recipient')}. ${get('body')}`.trim()
    case 'patent':
      return `Draft a patent application for inventor ${get('inventor')}. Description: ${get('description')}`.trim()
    case 'application-draft':
      return `Draft an application for applicant ${get('applicant')}. ${get('body')}`.trim()
    case 'interim-application':
      return `Draft an interim application. Plaintiff: ${get('plaintiff')}. Defendant: ${get('defendant')}. Grounds: ${get('grounds')}`.trim()
    case 'affidavit':
      return `Draft an affidavit for deponent ${get('deponent')}. Statements: ${get('statements')}`.trim()
    case 'bail-application':
      return `Draft a bail application. Applicant: ${get('applicant')}. Opposite Party: ${get('opposite_party')}. Court: ${get('court_details')}. FIR Details: ${get('fir_details')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'criminal-appeal':
      return `Draft a criminal appeal. Appellant: ${get('appellant')}. Respondent: ${get('respondent')}. Court: ${get('court_details')}. Impugned Order: ${get('impugned_order')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    default:
      return 'Generate a legal document based on the provided information.'
  }
}

export function CaseWorkspace() {
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = caseIdParam!
  const navigate = useNavigate()
  const { setSidebarCollapsed } = useUIState()
  const [caseName, setCaseName] = useState('Case Workspace')
  const [caseClient, setCaseClient] = useState<Client | null>(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)

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
    sources,
    selectedSourceIds,
    isLoading: sourcesLoading,
    isUploading,
    toggleSourceSelection,
    selectAllSources,
    deselectAllSources,
    uploadFile,
    deleteSource,
    linkContent,
  } = useCaseSources(caseId)

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
    updateSettings: updateChatSettings,
  } = useDraftChat(caseId)

  const {
    drafts,
    createDraft,
    updateDraftLocal,
    saveDraftToBackend,
    deleteDraft,
  } = useDrafts(caseId)

  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTab,
    setTabDirty,
  } = useWorkspaceTabs(drafts)

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

  // Fetch the client linked to this case
  useEffect(() => {
    caseApi.getClients(caseId).then((response) => {
      const clients = response.data
      if (clients && clients.length > 0) {
        setCaseClient(mapBackendClient(clients[0]))
      }
    }).catch(() => {
      // No client linked or API error — leave null
    })
  }, [caseId])

  // Whether any tabs are open (to show header tool buttons vs landing)
  const hasTabs = tabs.length > 0

  const handleBack = () => {
    setSidebarCollapsed(false)
    navigate('/cases')
  }

  const handleSendMessage = async (query: string) => {
    await draftSendMessage(query, Array.from(selectedSourceIds))
  }

  const handleSendToChat = (text: string) => {
    setRightPanelOpen(true)
    handleSendMessage(text)
  }

  const handleDraftClick = (draft: Draft) => {
    openTab(draft)
  }

  const handleSaveDraftLocal = (id: string, title: string, content: string) => {
    updateDraftLocal(id, { title, content })
  }

  const handleSaveDraftToBackend = async (id: string, title: string, content: string) => {
    updateDraftLocal(id, { title, content })
    await saveDraftToBackend(id, title, content)
  }

  const handleDeleteDraft = async (id: string) => {
    const tabId = `draft-${id}`
    closeTab(tabId)
    await deleteDraft(id)
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

  const handleDraftingClick = () => {
    setSelectedTemplate(DRAFT_TEMPLATES[0])
    setFormModalOpen(true)
  }

  const handleTemplateClick = (template: DraftTemplate) => {
    setSelectedTemplate(template)
  }

  const handleGenerate = async (
    templateId: string,
    formData: TemplateFormData,
    sourceIds: string[]
  ) => {
    const config = TEMPLATE_TO_DOC_CONFIG[templateId] || { documentType: 'legal_notice' as DocumentType }
    const title = (formData['title'] as string) || DRAFT_TEMPLATES.find((t) => t.id === templateId)?.name || 'Untitled'

    const body = assembleBody(templateId, formData)
    const hasText = body.length > 0
    const hasFiles = sourceIds.length > 0

    // Extract language for criminal templates
    const language = formData['language'] as Language | undefined

    // Build config object for criminal-specific fields
    const isCriminal = templateId === 'bail-application' || templateId === 'criminal-appeal'
    const criminalConfigKeys = [
      'fir_details', 'criminal_history', 'bail_history', 'co_accused_details',
      'impugned_order', 'court_details', 'facts', 'relief_sought',
      'applicant', 'opposite_party', 'appellant', 'respondent',
    ]
    let draftConfig: Record<string, string> | undefined
    if (isCriminal) {
      const entries = criminalConfigKeys
        .filter((key) => {
          const val = formData[key]
          return typeof val === 'string' && val.trim().length > 0
        })
        .map((key) => [key, (formData[key] as string).trim()])
      if (entries.length > 0) {
        draftConfig = Object.fromEntries(entries)
      }
    }

    const request: CreateDraftRequest = {
      title,
      document_type: config.documentType,
      input_mode: hasFiles && !hasText ? 'file' : 'freetext',
      subtype: config.subtype,
      freetext_body: hasText ? body : undefined,
      file_ids: hasFiles ? sourceIds : undefined,
      language: isCriminal ? language : undefined,
      config: draftConfig,
    }

    const pendingDraft = createDraft(request)
    setFormModalOpen(false)
    setSelectedTemplate(null)
    openTab(pendingDraft)
  }

  return (
    <div className="h-screen flex flex-col bg-kx-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-kx-card-border bg-kx-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 h-8 px-3 text-ledger-gray-600 hover:text-kx-primary-700">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-4 w-px bg-ledger-gray-300" />
          <h2 className="text-lg font-bold text-kx-primary-900 truncate">
            {caseName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {hasTabs && (
            <>
              <HeaderToolButtons onDraftingClick={handleDraftingClick} />
              <div className="h-4 w-px bg-ledger-gray-300 mx-1" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-kx-primary-700"
            title={leftPanelOpen ? 'Hide left panel' : 'Show left panel'}
          >
            {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-kx-primary-700"
            title={rightPanelOpen ? 'Hide chat' : 'Show chat'}
          >
            {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden bg-kx-card">
        {leftPanelOpen && (
          <div className="w-72 flex-shrink-0 flex flex-col border-r border-kx-card-border overflow-hidden">
            <LeftSidebar
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              isSourcesLoading={sourcesLoading}
              isUploading={isUploading}
              drafts={drafts}
              onToggleSourceSelection={toggleSourceSelection}
              onSelectAllSources={selectAllSources}
              onDeselectAllSources={deselectAllSources}
              onUploadFile={uploadFile}
              onDeleteSource={deleteSource}
              onLinkContent={linkContent}
              onDraftClick={handleDraftClick}
              onDeleteDraft={handleDeleteDraft}
            />
          </div>
        )}

        <div className="flex-1 min-h-0 min-w-0">
          <CenterPanel
            tabs={tabs}
            activeTabId={activeTabId}
            drafts={drafts}
            onTabClick={setActiveTab}
            onTabClose={closeTab}
            onSaveDraftLocal={handleSaveDraftLocal}
            onSaveDraftToBackend={handleSaveDraftToBackend}
            onDeleteDraft={handleDeleteDraft}
            onRetryDraft={handleRetryDraft}
            onTabDirtyChange={setTabDirty}
            onDraftingClick={handleDraftingClick}
            onSendToChat={handleSendToChat}
          />
        </div>

        {rightPanelOpen && (
          <>
            {/* Drag handle */}
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
                selectedSourceCount={selectedSourceIds.size}
                settings={chatSettings}
                onSendMessage={handleSendMessage}
                onClearChat={clearChat}
                onDeleteSession={deleteChatSession}
                onSelectSession={selectSession}
                onUpdateSettings={updateChatSettings}
              />
            </div>
          </>
        )}
      </div>

      <TemplateFormModal
        template={selectedTemplate}
        isOpen={formModalOpen}
        sources={sources}
        isGenerating={false}
        client={caseClient}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        onClose={() => setFormModalOpen(false)}
        onGenerate={handleGenerate}
        onTemplateChange={handleTemplateClick}
        templates={DRAFT_TEMPLATES}
      />
    </div>
  )
}

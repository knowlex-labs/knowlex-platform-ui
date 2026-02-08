import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, RefreshCw, Trash2, Download, FileDown, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNavigation } from '@/contexts/navigation-context'
import { caseApi } from '@/services/api/case-api'
import { useCaseSources } from '@/hooks/use-case-sources'
import { useWorkspaceChat } from '@/hooks/use-workspace-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { useWorkspaceTabs } from '@/hooks/use-workspace-tabs'
import { LeftSidebar } from './left-sidebar'
import { CenterPanel } from './center-panel'
import { StudioPanel } from './studio-panel'
import { TemplateFormModal } from './template-form-modal'
import { downloadAsTxt, downloadAsDoc, downloadAsPdf } from '@/lib/draft-renderer'
import type { CreateDraftRequest, DocumentType } from '@/services/api/drafts-api'
import type { Draft, DraftTemplate, TemplateFormData } from '@/types'
import { DRAFT_TEMPLATES } from '@/types'

// Maps each template to its API document_type and optional subtype
const TEMPLATE_TO_DOC_CONFIG: Record<string, { documentType: DocumentType; subtype?: string }> = {
  'notice': { documentType: 'legal_notice', subtype: 'demand' },
  'patent': { documentType: 'application' },
  'application-draft': { documentType: 'application', subtype: 'vakalatnama' },
  'interim-application': { documentType: 'affidavit', subtype: 'interim_application' },
  'affidavit': { documentType: 'affidavit', subtype: 'plaint' },
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
    default:
      return 'Generate a legal document based on the provided information.'
  }
}

interface CaseWorkspaceProps {
  caseId: string
  caseTitle?: string
}

export function CaseWorkspace({ caseId, caseTitle }: CaseWorkspaceProps) {
  const { setSelectedCaseId, setSidebarCollapsed } = useNavigation()
  const [caseName, setCaseName] = useState(caseTitle ?? 'Case Workspace')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)

  // Draft selection state
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set())

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
    batchDelete: batchDeleteSources,
    batchLinkContent,
  } = useCaseSources(caseId)

  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    clearChat,
  } = useWorkspaceChat(caseId)

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
    splitMode,
    openTab,
    closeTab,
    setActiveTab,
    toggleSplitMode,
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

  // Close download dropdown when clicking outside
  useEffect(() => {
    if (!downloadMenuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setDownloadMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [downloadMenuOpen])

  // Clean up draft selections when drafts change (remove stale IDs)
  useEffect(() => {
    setSelectedDraftIds((prev) => {
      const draftIdSet = new Set(drafts.map((d) => d.id))
      const cleaned = new Set([...prev].filter((id) => draftIdSet.has(id)))
      return cleaned.size === prev.size ? prev : cleaned
    })
  }, [drafts])

  // Draft selection handlers
  const toggleDraftSelection = useCallback((draftId: string) => {
    setSelectedDraftIds((prev) => {
      const next = new Set(prev)
      if (next.has(draftId)) {
        next.delete(draftId)
      } else {
        next.add(draftId)
      }
      return next
    })
  }, [])

  const selectAllDrafts = useCallback(() => {
    setSelectedDraftIds(new Set(drafts.map((d) => d.id)))
  }, [drafts])

  const deselectAllDrafts = useCallback(() => {
    setSelectedDraftIds(new Set())
  }, [])

  // Whether anything is selected
  const hasSelection = selectedSourceIds.size > 0 || selectedDraftIds.size > 0
  const totalSelected = selectedSourceIds.size + selectedDraftIds.size

  const handleBack = () => {
    setSelectedCaseId(null)
    setSidebarCollapsed(false)
  }

  const handleSendMessage = async (query: string) => {
    await sendMessage(query, Array.from(selectedSourceIds))
  }

  const handleDraftClick = (draft: Draft) => {
    openTab(draft)
  }

  const handleSaveDraftLocal = (id: string, title: string, content: string) => {
    updateDraftLocal(id, { title, content })
  }

  const handleSaveDraftToBackend = async (id: string, title: string, content: string) => {
    updateDraftLocal(id, { title, content })
    await saveDraftToBackend(id)
  }

  const handleDeleteDraft = async (id: string) => {
    const tabId = `draft-${id}`
    closeTab(tabId)
    await deleteDraft(id)
  }

  // Unified header actions
  const handleReindex = () => {
    if (selectedSourceIds.size > 0) {
      batchLinkContent(Array.from(selectedSourceIds))
    }
  }

  const handleDownload = (format: 'pdf' | 'doc' | 'txt') => {
    const selectedDrafts = drafts.filter((d) => selectedDraftIds.has(d.id) && d.status === 'completed')
    for (const draft of selectedDrafts) {
      const sections = draft.sections?.length ? draft.sections : undefined
      if (format === 'pdf') downloadAsPdf(draft.title, draft.content, sections)
      else if (format === 'doc') downloadAsDoc(draft.title, draft.content, sections)
      else downloadAsTxt(draft.title, draft.content, sections)
    }
    setDownloadMenuOpen(false)
  }

  const handleDeleteSelected = async () => {
    // Delete selected sources
    if (selectedSourceIds.size > 0) {
      await batchDeleteSources(Array.from(selectedSourceIds))
    }
    // Delete selected drafts
    for (const id of selectedDraftIds) {
      await handleDeleteDraft(id)
    }
    setSelectedDraftIds(new Set())
  }

  // Tool handlers
  const handleDraftingClick = () => {
    setSelectedTemplate(DRAFT_TEMPLATES[0])
    setFormModalOpen(true)
  }

  const handleGenerateReport = () => {
    handleSendMessage('Generate a detailed legal analysis report from the selected documents.')
  }

  const handleGenerateSummary = () => {
    handleSendMessage('Summarize the key points and important information from the selected documents.')
  }

  const handleGenerateFacts = () => {
    handleSendMessage('Extract and list the key facts from the selected documents.')
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

    const request: CreateDraftRequest = {
      title,
      document_type: config.documentType,
      input_mode: hasFiles && !hasText ? 'file' : 'freetext',
      subtype: config.subtype,
      freetext_body: hasText ? body : undefined,
      file_ids: hasFiles ? sourceIds : undefined,
    }

    const pendingDraft = createDraft(request)
    setFormModalOpen(false)
    setSelectedTemplate(null)
    openTab(pendingDraft)
  }

  return (
    <div className="h-screen flex flex-col bg-ledger-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ledger-gray-200 bg-ledger-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 h-8 px-3 text-ledger-gray-600 hover:text-ledger-black">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-4 w-px bg-ledger-gray-300" />
          <h2 className="text-base font-semibold text-ledger-black truncate">
            {caseName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <>
              <span className="text-xs text-ledger-gray-500 mr-1">
                {totalSelected} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReindex}
                disabled={sourcesLoading || isUploading}
                className="h-8 gap-2 text-ledger-gray-600 border-ledger-gray-300"
                title="Re-index selected"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", sourcesLoading ? "animate-spin" : "")} />
                <span className="hidden sm:inline">Re-index</span>
              </Button>
              {/* Download Dropdown */}
              <div className="relative" ref={downloadMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-ledger-gray-600 border-ledger-gray-300"
                  onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {downloadMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 rounded border border-ledger-gray-200 bg-ledger-white shadow-md z-50">
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                    >
                      <FileDown className="h-4 w-4" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownload('doc')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                    >
                      <FileText className="h-4 w-4" />
                      DOC
                    </button>
                    <button
                      onClick={() => handleDownload('txt')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                    >
                      <FileText className="h-4 w-4" />
                      TXT
                    </button>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={sourcesLoading || isUploading}
                className="h-8 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                title="Delete selected"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
              <div className="h-4 w-px bg-ledger-gray-300 mx-1" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-ledger-black"
            title={leftPanelOpen ? 'Hide left panel' : 'Show left panel'}
          >
            {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-ledger-black"
            title={rightPanelOpen ? 'Hide tools' : 'Show tools'}
          >
            {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-ledger-white">
        {/* Left Sidebar - Sources + Drafts */}
        {leftPanelOpen && (
          <div className="w-72 flex-shrink-0 flex flex-col border-r border-ledger-gray-200 overflow-hidden">
            <LeftSidebar
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              isSourcesLoading={sourcesLoading}
              isUploading={isUploading}
              drafts={drafts}
              selectedDraftIds={selectedDraftIds}
              onToggleSourceSelection={toggleSourceSelection}
              onSelectAllSources={selectAllSources}
              onDeselectAllSources={deselectAllSources}
              onToggleDraftSelection={toggleDraftSelection}
              onSelectAllDrafts={selectAllDrafts}
              onDeselectAllDrafts={deselectAllDrafts}
              onUploadFile={uploadFile}
              onDeleteSource={deleteSource}
              onLinkContent={linkContent}
              onDraftClick={handleDraftClick}
            />
          </div>
        )}

        {/* Center Panel - Chat + Draft Tabs */}
        <div className="flex-1 min-h-0 min-w-0">
          <CenterPanel
            tabs={tabs}
            activeTabId={activeTabId}
            splitMode={splitMode}
            messages={messages}
            isLoading={chatLoading}
            selectedSourceCount={selectedSourceIds.size}
            drafts={drafts}
            onTabClick={setActiveTab}
            onTabClose={closeTab}
            onToggleSplit={toggleSplitMode}
            onSendMessage={handleSendMessage}
            onClearChat={clearChat}
            onSaveDraftLocal={handleSaveDraftLocal}
            onSaveDraftToBackend={handleSaveDraftToBackend}
            onDeleteDraft={handleDeleteDraft}
            onTabDirtyChange={setTabDirty}
          />
        </div>

        {/* Right Sidebar - Tools */}
        {rightPanelOpen && (
          <div className="w-80 flex-shrink-0 flex flex-col border-l border-ledger-gray-200 overflow-hidden">
            <StudioPanel
              onDraftingClick={handleDraftingClick}
              onGenerateReport={handleGenerateReport}
              onGenerateSummary={handleGenerateSummary}
              onGenerateFacts={handleGenerateFacts}
              selectedSourceCount={selectedSourceIds.size}
            />
          </div>
        )}
      </div>

      {/* Template Form Modal */}
      <TemplateFormModal
        template={selectedTemplate}
        isOpen={formModalOpen}
        sources={sources}
        isGenerating={false}
        onClose={() => setFormModalOpen(false)}
        onGenerate={handleGenerate}
        onTemplateChange={handleTemplateClick}
        templates={DRAFT_TEMPLATES}
      />
    </div>
  )
}

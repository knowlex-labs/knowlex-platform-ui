import { useState, useEffect } from 'react'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNavigation } from '@/contexts/navigation-context'
import { useCaseSources } from '@/hooks/use-case-sources'
import { useWorkspaceChat } from '@/hooks/use-workspace-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { useWorkspaceTabs } from '@/hooks/use-workspace-tabs'
import { LeftSidebar } from './left-sidebar'
import { CenterPanel } from './center-panel'
import { ToolsSidebar } from './tools-sidebar'
import { TemplateFormModal } from './template-form-modal'
import { DraftPreview } from './draft-preview'
import type { CreateDraftRequest, DocumentType } from '@/services/api/drafts-api'
import type { Draft, DraftTemplate, TemplateFormData } from '@/types'
import { DRAFT_TEMPLATES } from '@/types'

// Maps each template to its API document_type and optional subtype
const TEMPLATE_TO_DOC_CONFIG: Record<string, { documentType: DocumentType; subtype?: string }> = {
  'notice':              { documentType: 'legal_notice',  subtype: 'demand' },
  'patent':              { documentType: 'application' },
  'application-draft':   { documentType: 'application',  subtype: 'vakalatnama' },
  'interim-application': { documentType: 'affidavit',    subtype: 'interim_application' },
  'affidavit':           { documentType: 'affidavit',    subtype: 'plaint' },
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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewContent, setPreviewContent] = useState('')

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
    batchDelete,
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
    updateDraft,
    deleteDraft,
  } = useDrafts(caseId)

  const [createdDraft, setCreatedDraft] = useState<Draft | null>(null)

  const {
    tabs,
    activeTabId,
    splitMode,
    openTab,
    closeTab,
    setActiveTab,
    toggleSplitMode,
  } = useWorkspaceTabs(drafts)

  // Auto-hide sidebar when workspace opens
  useEffect(() => {
    setSidebarCollapsed(true)
  }, [setSidebarCollapsed])

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

  const handleSaveDraft = (id: string, title: string, content: string) => {
    updateDraft(id, { title, content })
  }

  const handleDeleteDraft = async (id: string) => {
    // Close the tab if it's open
    const tabId = `draft-${id}`
    closeTab(tabId)
    await deleteDraft(id)
  }

  // Tool handlers
  const handleDraftingClick = () => {
    // Open template selection - show first template by default
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
    setIsGenerating(true)
    try {
      const config = TEMPLATE_TO_DOC_CONFIG[templateId] || { documentType: 'legal_notice' as DocumentType }
      const title = (formData['title'] as string) || DRAFT_TEMPLATES.find((t) => t.id === templateId)?.name || 'Untitled'

      const request: CreateDraftRequest = {
        title,
        body: assembleBody(templateId, formData),
        document_type: config.documentType,
        file_ids: sourceIds.length > 0 ? sourceIds : undefined,
        metadata: config.subtype ? { subtype: config.subtype } : undefined,
      }

      const draft = await createDraft(request)
      setCreatedDraft(draft)
      setPreviewTitle(draft.title)
      setPreviewContent(draft.content)
      setFormModalOpen(false)
      setPreviewOpen(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePreview = (title: string, content: string) => {
    if (createdDraft) {
      updateDraft(createdDraft.id, { title, content })
      openTab({ ...createdDraft, title, content })
    }
    setPreviewOpen(false)
    setPreviewTitle('')
    setPreviewContent('')
    setCreatedDraft(null)
    setSelectedTemplate(null)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setPreviewTitle('')
    setPreviewContent('')
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-ledger-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ledger-gray-200 bg-ledger-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 h-8 px-3 text-ledger-gray-600 hover:text-ledger-black">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-4 w-px bg-ledger-gray-300" />
          <h2 className="text-base font-semibold text-ledger-black truncate">
            {caseTitle ?? 'Case Workspace'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedSourceIds.size > 0 && (
            <>
              {sources.filter(s => selectedSourceIds.has(s.id)).some(
                s => s.indexingStatus === 'INDEXING_PENDING' || s.indexingStatus === 'INDEXING_FAILED'
              ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => batchLinkContent(Array.from(selectedSourceIds))}
                    disabled={sourcesLoading || isUploading}
                    className="h-8 gap-2 text-ledger-gray-600 border-ledger-gray-300"
                    title="Re-index selected sources"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", sourcesLoading ? "animate-spin" : "")} />
                    <span className="hidden sm:inline">Re-index</span>
                  </Button>
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchDelete(Array.from(selectedSourceIds))}
                disabled={sourcesLoading || isUploading}
                className="h-8 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                title="Delete selected sources"
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
      <div className="flex-1 flex gap-2 p-2 min-h-0 overflow-hidden bg-ledger-gray-50">
        {/* Left Sidebar - Sources + Drafts */}
        {leftPanelOpen && (
          <div className="w-72 flex-shrink-0 flex flex-col bg-ledger-white rounded-lg border border-ledger-gray-200 overflow-hidden">
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
            onSaveDraft={handleSaveDraft}
            onDeleteDraft={handleDeleteDraft}
          />
        </div>

        {/* Right Sidebar - Tools */}
        {rightPanelOpen && (
          <div className="w-64 flex-shrink-0 flex flex-col bg-ledger-white rounded-lg border border-ledger-gray-200 overflow-hidden">
            <ToolsSidebar
              onDraftingClick={handleDraftingClick}
              onGenerateReport={handleGenerateReport}
              onGenerateSummary={handleGenerateSummary}
              onGenerateFacts={handleGenerateFacts}
              selectedSourceCount={selectedSourceIds.size}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <TemplateFormModal
        template={selectedTemplate}
        isOpen={formModalOpen}
        sources={sources}
        isGenerating={isGenerating}
        onClose={() => setFormModalOpen(false)}
        onGenerate={handleGenerate}
        onTemplateChange={handleTemplateClick}
        templates={DRAFT_TEMPLATES}
      />

      <DraftPreview
        title={previewTitle}
        content={previewContent}
        isOpen={previewOpen}
        onClose={handleClosePreview}
        onSave={handleSavePreview}
        onContentChange={setPreviewContent}
        onTitleChange={setPreviewTitle}
      />
    </div>
  )
}

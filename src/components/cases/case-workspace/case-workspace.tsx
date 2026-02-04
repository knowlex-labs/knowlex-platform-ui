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
import type { Draft, DraftTemplate, TemplateFormData } from '@/types'
import { DRAFT_TEMPLATES } from '@/types'
import type { DocumentType } from '@/hooks/use-drafts'

// Map template IDs to valid API document types
const TEMPLATE_TO_DOCUMENT_TYPE: Record<string, DocumentType> = {
  'notice': 'legal_notice',
  'patent': 'application',
  'application-draft': 'application',
  'interim-application': 'application',
  'affidavit': 'affidavit',
}

interface CaseWorkspaceProps {
  caseId: string
  caseTitle?: string
}

// Mock generate function - replace with actual API call when backend is ready
async function generateDraft(
  templateId: string,
  formData: TemplateFormData,
  _sourceIds: string[],
  _caseId: string
): Promise<{ title: string; content: string }> {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  const template = DRAFT_TEMPLATES.find((t) => t.id === templateId)
  const title = (formData['title'] as string) || template?.name || 'Untitled'

  let content = ''
  switch (templateId) {
    case 'notice':
      content = `LEGAL NOTICE\n\nTo: ${formData['recipient'] || '[Recipient Name]'}\nDate: ${new Date().toLocaleDateString()}\n\nRE: ${title}\n\nDear ${formData['recipient'] || '[Recipient Name]'},\n\n${formData['body'] || 'This notice is being served to inform you of the following matter requiring your immediate attention.'}\n\nPlease take notice that the undersigned hereby demands that you comply with all applicable legal requirements within the timeframe specified by law.\n\nFailure to respond to this notice within the prescribed period may result in further legal action being taken without additional notice.\n\nPlease govern yourself accordingly.\n\nRespectfully,\n[Sender Name]\n[Designation]`
      break
    case 'patent':
      content = `PATENT APPLICATION\n\nTitle: ${title}\n\nInventor: ${formData['inventor'] || '[Inventor Name]'}\nFiling Date: ${new Date().toLocaleDateString()}\n\nABSTRACT\n\n${formData['description'] || '[Description of the invention]'}\n\nBACKGROUND OF THE INVENTION\n\nField of the Invention:\nThis invention relates to the technical field as described herein.\n\nDescription of Related Art:\nThe present invention addresses limitations in existing solutions.\n\nDETAILED DESCRIPTION\n\n${formData['description'] || '[Detailed description of the invention, including preferred embodiments]'}\n\nCLAIMS\n\n1. A method/apparatus/system for [brief description], comprising:\n   a) [First element or step]\n   b) [Second element or step]\n   c) [Additional elements or steps as needed]\n\n2. The method/apparatus/system of claim 1, wherein [additional limitation].\n\n3. The method/apparatus/system of claim 1, further comprising [additional feature].`
      break
    case 'application-draft':
      content = `APPLICATION\n\n${title}\n\nApplicant: ${formData['applicant'] || '[Applicant Name]'}\nDate: ${new Date().toLocaleDateString()}\n\nTO THE HONORABLE COURT/AUTHORITY:\n\n${formData['body'] || 'The applicant respectfully submits this application for your consideration.'}\n\nGROUNDS FOR APPLICATION:\n\n1. The applicant is duly authorized to file this application.\n2. All necessary requirements have been fulfilled.\n3. The application is made in good faith.\n\nPRAYER:\n\nIn light of the above, the applicant respectfully prays that this Honorable Court/Authority may be pleased to:\n\n1. Accept and process this application.\n2. Grant the relief sought herein.\n3. Pass any other order deemed fit and proper.\n\nRespectfully submitted,\n\n${formData['applicant'] || '[Applicant Name]'}\n[Date]`
      break
    case 'interim-application':
      content = `IN THE [COURT NAME]\n\nINTERIM APPLICATION\n\n${title}\n\n${formData['plaintiff'] || '[Plaintiff Name]'} .............. Plaintiff/Applicant\nVERSUS\n${formData['defendant'] || '[Defendant Name]'} .............. Defendant/Respondent\n\nAPPLICATION UNDER [SECTION/RULE]\n\nMost Respectfully Showeth:\n\n1. That the above-named applicant has filed the main case which is pending before this Honorable Court.\n\n2. That the applicant is constrained to file this interim application on the following grounds:\n\nGROUNDS:\n\n${formData['grounds'] || '[State the grounds for the interim application]'}\n\nPRAYER:\n\nIn view of the above facts and circumstances, it is most respectfully prayed that this Honorable Court may be pleased to:\n\na) Grant interim relief as prayed for.\nb) Issue appropriate directions to the respondent.\nc) Pass any other order deemed fit in the interests of justice.\n\nPlace: [City]\nDate: ${new Date().toLocaleDateString()}\n\n${formData['plaintiff'] || '[Plaintiff Name]'}\nThrough Counsel`
      break
    case 'affidavit':
      content = `AFFIDAVIT\n\n${title}\n\nI, ${formData['deponent'] || '[Deponent Name]'}, aged ___ years, residing at [Address], do hereby solemnly affirm and state as follows:\n\n${formData['statements'] || '1. That I am the deponent herein and am competent to swear this affidavit.\\n\\n2. That I have personal knowledge of the facts stated herein.\\n\\n3. [Additional statements]'}\n\nVERIFICATION\n\nI, the above-named deponent, do hereby verify that the contents of paragraphs 1 to ___ of this affidavit are true to my personal knowledge, and nothing material has been concealed therefrom.\n\nVerified at [Place] on this ${new Date().toLocaleDateString()}.\n\n_______________________\n${formData['deponent'] || '[Deponent Name]'}\n(Deponent)\n\nSWORN BEFORE ME\n\n_______________________\nNotary Public / Oath Commissioner`
      break
    default:
      content = `${title}\n\nGenerated draft content based on the provided information.`
  }

  return { title, content }
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
    addDraft,
    updateDraft,
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

  const handleSaveDraft = async (id: string, title: string, content: string) => {
    await updateDraft(id, { title, content })
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
      const result = await generateDraft(templateId, formData, sourceIds, caseId)
      setPreviewTitle(result.title)
      setPreviewContent(result.content)
      setFormModalOpen(false)
      setPreviewOpen(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePreview = async (title: string, content: string) => {
    const documentType = selectedTemplate
      ? TEMPLATE_TO_DOCUMENT_TYPE[selectedTemplate.id] || 'legal_notice'
      : 'legal_notice'
    const newDraft = await addDraft(title, content, documentType)
    setPreviewOpen(false)
    setPreviewTitle('')
    setPreviewContent('')
    setSelectedTemplate(null)
    // Open the new draft as a tab
    openTab(newDraft)
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

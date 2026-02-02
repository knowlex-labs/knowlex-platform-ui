import { useState, useEffect } from 'react'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Grid3x3, RefreshCw, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigation } from '@/contexts/navigation-context'
import { useCaseSources } from '@/hooks/use-case-sources'
import { useWorkspaceChat } from '@/hooks/use-workspace-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { SourcesPanel } from './sources-panel'
import { ChatPanel } from './chat-panel'
import { TemplateCard } from './template-card'
import { TemplateFormModal } from './template-form-modal'
import { DraftPreview } from './draft-preview'
import { DraftItem } from './draft-item'
import { DraftEditorModal } from './draft-editor-modal'
import type { Draft, DraftTemplate, TemplateFormData } from '@/types'
import { DRAFT_TEMPLATES } from '@/types'

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

function downloadDraft(title: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function CaseWorkspace({ caseId, caseTitle }: CaseWorkspaceProps) {
  const { setSelectedCaseId, setSidebarCollapsed } = useNavigation()
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [caseMenuOpen, setCaseMenuOpen] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-case-menu]')) {
        setCaseMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const [showAllTemplates, setShowAllTemplates] = useState(false)
  const [draftEditorOpen, setDraftEditorOpen] = useState(false)
  const [editingContent, setEditingContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

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

  // Auto-hide sidebar when workspace opens
  useEffect(() => {
    setSidebarCollapsed(true)
    // Don't restore on unmount since handleBack already does it
  }, [setSidebarCollapsed])

  const handleBack = () => {
    setSelectedCaseId(null)
    setSidebarCollapsed(false)
  }

  const handleSendMessage = async (query: string) => {
    await sendMessage(query, Array.from(selectedSourceIds))
  }

  const handleEditDraft = (content: string) => {
    setEditingContent(content)
    setDraftEditorOpen(true)
  }

  const handleSaveDraftFromChat = (id: string | null, title: string, content: string) => {
    if (id) {
      updateDraft(id, { title, content })
    } else {
      addDraft(title, content)
    }
  }

  const handleTemplateClick = (template: DraftTemplate) => {
    setSelectedTemplate(template)
    setFormModalOpen(true)
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

  const handleSavePreview = (title: string, content: string) => {
    addDraft(title, content)
    setPreviewOpen(false)
    setPreviewTitle('')
    setPreviewContent('')
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setPreviewTitle('')
    setPreviewContent('')
  }

  const handleEditExistingDraft = (draft: Draft) => {
    setEditingDraft(draft)
    setEditModalOpen(true)
  }

  const handleSaveDraft = (id: string | null, title: string, content: string) => {
    if (id) {
      updateDraft(id, { title, content })
    } else {
      addDraft(title, content)
    }
  }

  const handleDownloadDraft = (draft: Draft) => {
    downloadDraft(draft.title, draft.content)
  }

  const displayedTemplates = showAllTemplates ? DRAFT_TEMPLATES : DRAFT_TEMPLATES.slice(0, 6)

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

          <div className="relative" data-case-menu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCaseMenuOpen(!caseMenuOpen)}
              className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-ledger-black"
              title="Case actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {caseMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-ledger-white border border-ledger-gray-200 rounded-lg shadow-lg z-50 py-1">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-ledger-gray-700 hover:bg-ledger-gray-50 hover:text-ledger-black"
                  onClick={() => setCaseMenuOpen(false)}
                >
                  Edit Case Details
                </button>
                <div className="h-px bg-ledger-gray-100 my-1" />
                <button
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => setCaseMenuOpen(false)}
                >
                  Delete Case
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-ledger-gray-300 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-ledger-black"
            title={sourcesOpen ? 'Hide sources' : 'Show sources'}
          >
            {sourcesOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-ledger-black"
            title={chatOpen ? 'Hide chat' : 'Show chat'}
          >
            {chatOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex gap-2 p-2 min-h-0 overflow-hidden bg-ledger-gray-50">
        {/* Sources Panel - Collapsible Left */}
        {sourcesOpen && (
          <div className="w-72 flex-shrink-0 flex flex-col bg-ledger-white rounded-lg border border-ledger-gray-200 overflow-hidden">
            <SourcesPanel
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              isLoading={sourcesLoading}
              isUploading={isUploading}
              onToggleSelection={toggleSourceSelection}
              onSelectAll={selectAllSources}
              onDeselectAll={deselectAllSources}
              onUploadFile={uploadFile}
              onDeleteSource={deleteSource}
              onLinkContent={linkContent}
            />
          </div>
        )}

        {/* Main Content - Single Panel with Tabs */}
        <div className="flex-1 min-h-0 flex flex-col bg-ledger-white rounded-lg border border-ledger-gray-200 overflow-hidden">
          <Tabs defaultValue="templates" className="flex-1 flex flex-col">
            {/* Tab List */}
            <div className="px-4 py-3 border-b border-ledger-gray-100">
              <TabsList className="inline-flex flex-row h-9 items-center justify-center rounded-lg bg-ledger-gray-100 p-1 text-ledger-gray-500 w-auto">
                <TabsTrigger
                  value="templates"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-ledger-black data-[state=active]:shadow-sm"
                >
                  Templates
                </TabsTrigger>
                <TabsTrigger
                  value="drafts"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-ledger-black data-[state=active]:shadow-sm"
                >
                  Drafts
                  {drafts.length > 0 && (
                    <span className="ml-2 text-xs bg-ledger-gray-200 px-1.5 py-0.5 rounded-full">
                      {drafts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value="templates" className="flex-1 p-4 overflow-auto">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  {displayedTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
                {!showAllTemplates && DRAFT_TEMPLATES.length > 6 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllTemplates(true)}
                    className="w-full gap-2"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    Show More Templates ({DRAFT_TEMPLATES.length - 6} more)
                  </Button>
                )}
                {showAllTemplates && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllTemplates(false)}
                    className="w-full"
                  >
                    Show Less
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="drafts" className="flex-1 mt-0 overflow-auto">
              {drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-ledger-gray-100 flex items-center justify-center mb-3">
                    <ArrowLeft className="h-6 w-6 text-ledger-gray-400 rotate-180" />
                  </div>
                  <p className="text-sm text-ledger-gray-600 font-medium">No drafts yet</p>
                  <p className="text-xs text-ledger-gray-500 mt-1">
                    Switch to Templates to generate your first draft
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {drafts.map((draft) => (
                    <DraftItem
                      key={draft.id}
                      draft={draft}
                      onEdit={handleEditExistingDraft}
                      onDelete={deleteDraft}
                      onDownload={handleDownloadDraft}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Panel - Collapsible Right */}
        {chatOpen && (
          <div className="w-80 flex-shrink-0 flex flex-col bg-ledger-white rounded-lg border border-ledger-gray-200 overflow-hidden">
            <ChatPanel
              messages={messages}
              isLoading={chatLoading}
              selectedSourceCount={selectedSourceIds.size}
              onSendMessage={handleSendMessage}
              onClearChat={clearChat}
              onEditDraft={handleEditDraft}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <TemplateFormModal
        template={selectedTemplate}
        isOpen={formModalOpen}
        sources={sources}
        selectedSourceIds={selectedSourceIds}
        isGenerating={isGenerating}
        onClose={() => setFormModalOpen(false)}
        onGenerate={handleGenerate}
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

      <DraftEditorModal
        draft={editingDraft}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveDraft}
        onDownload={downloadDraft}
      />

      <DraftEditorModal
        draft={editingContent ? { id: '', title: 'AI Generated Draft', content: editingContent, caseId, createdAt: new Date(), updatedAt: new Date() } : null}
        isOpen={draftEditorOpen}
        onClose={() => {
          setDraftEditorOpen(false)
          setEditingContent('')
        }}
        onSave={handleSaveDraftFromChat}
        onDownload={(title, content) => downloadDraft(title, content)}
      />
    </div>
  )
}

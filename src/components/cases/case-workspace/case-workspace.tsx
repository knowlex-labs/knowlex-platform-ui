import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/navigation-context'
import { useCaseSources } from '@/hooks/use-case-sources'
import { useWorkspaceChat } from '@/hooks/use-workspace-chat'
import { useDrafts } from '@/hooks/use-drafts'
import { useNotes } from '@/hooks/use-notes'
import { SourcesPanel } from './sources-panel'
import { ChatPanel } from './chat-panel'
import { ToolsPanel } from './tools-panel'
import { DraftsPanel } from './drafts-panel'
import { NotesPanel } from './notes-panel'
import { WorkspaceTabs, WorkspaceTabContent } from './workspace-tabs'
import { DraftEditorModal } from './draft-editor-modal'
import type { WorkspaceTab } from '@/types'

interface CaseWorkspaceProps {
  caseId: string
  caseTitle?: string
}

export function CaseWorkspace({ caseId, caseTitle }: CaseWorkspaceProps) {
  const { setSelectedCaseId, setSidebarCollapsed } = useNavigation()
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat')
  const [draftEditorOpen, setDraftEditorOpen] = useState(false)
  const [editingContent, setEditingContent] = useState('')

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
  } = useCaseSources(caseId)

  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    executeTool,
    clearChat,
  } = useWorkspaceChat(caseId)

  const {
    drafts,
    addDraft,
    updateDraft,
    deleteDraft,
  } = useDrafts(caseId)

  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
  } = useNotes(caseId)

  const handleBack = () => {
    setSelectedCaseId(null)
    // Re-expand sidebar when leaving workspace
    setSidebarCollapsed(false)
  }

  const handleSendMessage = async (query: string) => {
    await sendMessage(query, Array.from(selectedSourceIds))
  }

  const handleExecuteTool = async (toolId: string) => {
    await executeTool(toolId, Array.from(selectedSourceIds))
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
    setActiveTab('drafts')
  }

  const handleDownloadDraft = (title: string, content: string) => {
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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-ledger-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Button>
        <div className="h-5 w-px bg-ledger-gray-300" />
        <h2 className="text-lg font-serif font-semibold text-ledger-black truncate">
          {caseTitle ?? 'Case Workspace'}
        </h2>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 min-h-0">
        {/* Sources Panel - Left */}
        <div className="lg:col-span-3 min-h-0 flex flex-col">
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
          />
        </div>

        {/* Center Panel with Tabs */}
        <div className="lg:col-span-6 min-h-0 flex flex-col">
          <WorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab}>
            <WorkspaceTabContent value="chat">
              <ChatPanel
                messages={messages}
                isLoading={chatLoading}
                selectedSourceCount={selectedSourceIds.size}
                onSendMessage={handleSendMessage}
                onClearChat={clearChat}
                onEditDraft={handleEditDraft}
              />
            </WorkspaceTabContent>
            <WorkspaceTabContent value="drafts">
              <DraftsPanel
                drafts={drafts}
                onAddDraft={addDraft}
                onUpdateDraft={updateDraft}
                onDeleteDraft={deleteDraft}
              />
            </WorkspaceTabContent>
            <WorkspaceTabContent value="notes">
              <NotesPanel
                notes={notes}
                onAddNote={addNote}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
              />
            </WorkspaceTabContent>
          </WorkspaceTabs>

          {/* Draft Editor Modal for editing from chat */}
          <DraftEditorModal
            draft={editingContent ? { id: '', title: 'AI Generated Draft', content: editingContent, caseId, createdAt: new Date(), updatedAt: new Date() } : null}
            isOpen={draftEditorOpen}
            onClose={() => {
              setDraftEditorOpen(false)
              setEditingContent('')
            }}
            onSave={handleSaveDraftFromChat}
            onDownload={handleDownloadDraft}
          />
        </div>

        {/* Tools Panel - Right */}
        <div className="lg:col-span-3 min-h-0 flex flex-col">
          <ToolsPanel
            selectedSourceCount={selectedSourceIds.size}
            isLoading={chatLoading}
            onExecuteTool={handleExecuteTool}
          />
        </div>
      </div>
    </div>
  )
}

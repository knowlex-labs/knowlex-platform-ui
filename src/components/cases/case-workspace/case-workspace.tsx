import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/navigation-context'
import { useCaseSources } from '@/hooks/use-case-sources'
import { useWorkspaceChat } from '@/hooks/use-workspace-chat'
import { SourcesPanel } from './sources-panel'
import { ChatPanel } from './chat-panel'
import { ToolsPanel } from './tools-panel'

interface CaseWorkspaceProps {
  caseId: string
  caseTitle?: string
}

export function CaseWorkspace({ caseId, caseTitle }: CaseWorkspaceProps) {
  const { setSelectedCaseId } = useNavigation()

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

  const handleBack = () => {
    setSelectedCaseId(null)
  }

  const handleSendMessage = async (query: string) => {
    await sendMessage(query, Array.from(selectedSourceIds))
  }

  const handleExecuteTool = async (toolId: string) => {
    await executeTool(toolId, Array.from(selectedSourceIds))
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

        {/* Chat Panel - Center */}
        <div className="lg:col-span-6 min-h-0 flex flex-col">
          <ChatPanel
            messages={messages}
            isLoading={chatLoading}
            selectedSourceCount={selectedSourceIds.size}
            onSendMessage={handleSendMessage}
            onClearChat={clearChat}
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

import { useState } from 'react'
import { useResearchChat } from '@/hooks/use-research-chat'
import { ResearchChatHeader } from './research-chat-header'
import { ResearchChatArea } from './research-chat-area'
import {
  ResearchSessionSidebarDesktop,
  ResearchSessionSidebarMobile,
  MobileSidebarToggle,
} from './research-session-sidebar'
import { ResearchSettingsPanel } from './research-settings-panel'

export function AIResearch() {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    createSession,
    deleteSession,
    settings,
    updateSettings,
  } = useResearchChat()

  const [settingsOpen, setSettingsOpen] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const headerTitle = activeSession?.title || 'AI Research'

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-16px)]">
      {/* Desktop session sidebar */}
      <ResearchSessionSidebarDesktop
        visible={sidebarVisible}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={createSession}
        onDeleteSession={deleteSession}
      />

      {/* Mobile session sidebar (Sheet) */}
      <ResearchSessionSidebarMobile
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={createSession}
        onDeleteSession={deleteSession}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <div className="md:hidden pl-2">
            <MobileSidebarToggle onClick={() => setMobileSidebarOpen(true)} />
          </div>
          <div className="flex-1">
            <ResearchChatHeader
              title={headerTitle}
              settingsOpen={settingsOpen}
              onToggleSettings={() => setSettingsOpen(!settingsOpen)}
              sidebarVisible={sidebarVisible}
              onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Chat area */}
        <ResearchChatArea
          messages={messages}
          isStreaming={isStreaming}
          isLoadingHistory={isLoadingHistory}
          onSendMessage={sendMessage}
          onCancelStream={cancelStream}
          hasActiveSession={!!activeSessionId}
        />
      </div>

      {/* Right settings panel (inline, no overlay) */}
      {settingsOpen && (
        <div className="hidden md:flex">
          <ResearchSettingsPanel
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        </div>
      )}
    </div>
  )
}

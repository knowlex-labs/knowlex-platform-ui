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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-is-mobile'

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
    startNewChat,
    deleteSession,
    settings,
    updateSettings,
  } = useResearchChat()

  const isMobile = useIsMobile()
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
        onNewChat={startNewChat}
        onDeleteSession={deleteSession}
      />

      {/* Mobile session sidebar (Sheet) */}
      <ResearchSessionSidebarMobile
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={startNewChat}
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
          <div className="px-4 py-2 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
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

      {/* Right settings panel — desktop inline, mobile Sheet */}
      {settingsOpen && !isMobile && (
        <div className="hidden md:flex">
          <ResearchSettingsPanel
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        </div>
      )}

      {/* Mobile settings Sheet */}
      <Sheet open={settingsOpen && isMobile} onOpenChange={(open) => { if (!open) setSettingsOpen(false) }}>
        <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-kx-card-border">
            <SheetTitle className="text-base">Settings</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            <ResearchSettingsPanel
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

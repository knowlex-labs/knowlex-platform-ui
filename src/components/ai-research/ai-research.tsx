import { useState } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatMessageList } from './chat-message-list'
import { ChatInput } from './chat-input'
import type { ChatSession, ChatMessage } from '@/types/chat.types'

// Initial placeholder session
const INITIAL_SESSION: ChatSession = {
  id: '1',
  title: 'New Research Session',
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI legal research assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ],
  createdAt: new Date(),
}

export function AIResearch() {
  const [sessions, setSessions] = useState<ChatSession[]>([INITIAL_SESSION])
  const [activeSessionId, setActiveSessionId] = useState<string>('1')

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]

  const handleSendMessage = (content: string) => {
    if (!content.trim() || !activeSession) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    // Simulate AI response
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: 'This is a placeholder response. AI research backend integration is coming soon.',
      timestamp: new Date(),
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage, assistantMessage],
            }
          : session
      )
    )
  }

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Research Session',
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Hello! I\'m your AI legal research assistant. How can I help you today?',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
  }

  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      // Don't delete the last session, just reset it
      setSessions([INITIAL_SESSION])
      setActiveSessionId(INITIAL_SESSION.id)
      return
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions[0].id)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen gap-4">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col border border-ledger-gray-200 rounded-lg overflow-hidden bg-ledger-white">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-ledger-gray-200">
          <h2 className="text-lg font-semibold text-ledger-black">
            {activeSession.title}
          </h2>
          <p className="text-xs text-ledger-gray-500 mt-0.5">
            AI-powered legal research assistant
          </p>
        </div>

        {/* Messages */}
        <ChatMessageList messages={activeSession.messages} />

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}

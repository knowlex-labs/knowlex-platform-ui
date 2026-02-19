import { Bot } from 'lucide-react'
import { ChatInterface } from './chat-interface'
import type { WorkspaceMessage } from '@/types'

interface ChatPanelProps {
  messages: WorkspaceMessage[]
  isLoading: boolean
  selectedSourceCount: number
  onSendMessage: (query: string) => Promise<void>
  onClearChat: () => void
}

export function ChatPanel({
  messages,
  isLoading,
  selectedSourceCount,
  onSendMessage,
  onClearChat,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-kx-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-kx-card-border">
        <Bot className="h-4 w-4 text-kx-primary-600" />
        <h3 className="text-sm font-semibold text-kx-primary-900">AI Assistant</h3>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          selectedSourceCount={selectedSourceCount}
          onSendMessage={onSendMessage}
          onClearChat={onClearChat}
        />
      </div>
    </div>
  )
}

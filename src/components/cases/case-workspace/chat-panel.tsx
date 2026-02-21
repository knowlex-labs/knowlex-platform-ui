import { Bot, MessageSquare, Pencil } from 'lucide-react'
import { ChatInterface } from './chat-interface'
import type { AgentMessage, AgentMode } from '@/types'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  messages: AgentMessage[]
  isStreaming: boolean
  error: string | null
  mode: AgentMode
  selectedSourceCount: number
  hasActiveDraft: boolean
  onSetMode: (mode: AgentMode) => void
  onSendMessage: (query: string) => void
  onCancelStream: () => void
  onClearChat: () => void
}

export function ChatPanel({
  messages,
  isStreaming,
  error,
  mode,
  selectedSourceCount,
  hasActiveDraft,
  onSetMode,
  onSendMessage,
  onCancelStream,
  onClearChat,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-kx-card">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kx-card-border">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-kx-primary-600" />
          <h3 className="text-sm font-semibold text-kx-primary-900">Agent</h3>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-ledger-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onSetMode('ask')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              mode === 'ask'
                ? 'bg-white text-kx-primary-700 shadow-sm'
                : 'text-ledger-gray-500 hover:text-ledger-gray-700'
            )}
          >
            <MessageSquare className="h-3 w-3" />
            Ask
          </button>
          <button
            onClick={() => onSetMode('edit')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              mode === 'edit'
                ? 'bg-white text-kx-primary-700 shadow-sm'
                : 'text-ledger-gray-500 hover:text-ledger-gray-700'
            )}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          mode={mode}
          selectedSourceCount={selectedSourceCount}
          hasActiveDraft={hasActiveDraft}
          onSendMessage={onSendMessage}
          onCancelStream={onCancelStream}
          onClearChat={onClearChat}
        />
      </div>
    </div>
  )
}

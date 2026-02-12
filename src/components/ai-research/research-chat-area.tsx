import { Bot } from 'lucide-react'
import { ResearchMessageList } from './research-message-list'
import { ResearchChatInput } from './research-chat-input'
import type { ResearchMessage } from '@/types'

interface ResearchChatAreaProps {
  messages: ResearchMessage[]
  isStreaming: boolean
  isLoadingHistory: boolean
  onSendMessage: (content: string) => void
  onCancelStream: () => void
  hasActiveSession: boolean
}

export function ResearchChatArea({
  messages,
  isStreaming,
  isLoadingHistory,
  onSendMessage,
  onCancelStream,
  hasActiveSession,
}: ResearchChatAreaProps) {
  const showEmptyState = !hasActiveSession || (messages.length === 0 && !isLoadingHistory)

  if (showEmptyState) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Centered greeting + input */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="h-12 w-12 rounded-full bg-ledger-gray-100 flex items-center justify-center mb-4">
            <Bot className="h-6 w-6 text-ledger-gray-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-ledger-black mb-1">
            Legal Research Assistant
          </h2>
          <p className="text-sm text-ledger-gray-500 mb-8">
            Ask questions about case law, statutes, and legal research
          </p>
        </div>
        <ResearchChatInput
          onSendMessage={onSendMessage}
          onCancelStream={onCancelStream}
          isStreaming={isStreaming}
        />
      </div>
    )
  }

  if (isLoadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ledger-black mx-auto mb-3" />
          <p className="text-sm text-ledger-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-ledger-gray-50">
      <ResearchMessageList messages={messages} />
      <ResearchChatInput
        onSendMessage={onSendMessage}
        onCancelStream={onCancelStream}
        isStreaming={isStreaming}
      />
    </div>
  )
}

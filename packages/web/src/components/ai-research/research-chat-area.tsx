import { ResearchMessageList } from './research-message-list'
import { ResearchChatInput } from './research-chat-input'
import type { ResearchMessage } from '@knowlex/core/types'

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
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-kx-primary-900 mb-8">
          What can I help you research?
        </h2>
        <div className="w-full max-w-2xl">
          <ResearchChatInput
            onSendMessage={onSendMessage}
            onCancelStream={onCancelStream}
            isStreaming={isStreaming}
            variant="hero"
          />
        </div>
      </div>
    )
  }

  if (isLoadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kx-primary-600 mx-auto mb-3" />
          <p className="text-sm text-ledger-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ResearchMessageList messages={messages} />
      <ResearchChatInput
        onSendMessage={onSendMessage}
        onCancelStream={onCancelStream}
        isStreaming={isStreaming}
      />
    </div>
  )
}

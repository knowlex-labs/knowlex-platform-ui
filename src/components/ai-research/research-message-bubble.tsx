import { useState } from 'react'
import { ChevronDown, ChevronRight, Wrench, Bot, User, Search } from 'lucide-react'
import { MarkdownRenderer } from './markdown-renderer'
import { StreamingIndicator } from './streaming-indicator'
import type { ResearchMessage, ToolCall } from '@/types'

function ToolCallsCollapsible({ toolCalls }: { toolCalls: ToolCall[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-ledger-gray-500 hover:text-ledger-gray-700 transition-colors"
      >
        <Wrench className="h-3 w-3" />
        <span>Used {toolCalls.length} tool{toolCalls.length > 1 ? 's' : ''}</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {isOpen && (
        <div className="mt-1.5 space-y-1.5 pl-4 border-l-2 border-ledger-gray-200">
          {toolCalls.map((tc, i) => (
            <div key={i} className="text-xs">
              <span className="font-medium text-ledger-gray-600">{tc.name}</span>
              {tc.result && (
                <p className="text-ledger-gray-400 mt-0.5 line-clamp-2">{tc.result}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ToolsIndicator({ toolCalls }: { toolCalls?: ToolCall[] }) {
  const name = toolCalls?.[toolCalls.length - 1]?.name
  return (
    <span className="inline-flex items-center gap-1.5 text-ledger-gray-400 text-xs">
      <Search className="h-3 w-3 animate-pulse" />
      <span>{name ? `Using ${name}...` : 'Searching...'}</span>
    </span>
  )
}

function UserBubble({ message }: { message: ResearchMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        <div className="flex items-center justify-end gap-1.5 mb-1">
          <span className="text-xs font-medium text-ledger-gray-500">You</span>
          <User className="h-3 w-3 text-ledger-gray-400" />
        </div>
        <div className="rounded-2xl rounded-br-sm bg-kx-primary-600 text-white px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

function AgentBubble({ message }: { message: ResearchMessage }) {
  const { isStreaming, streamingPhase, content, toolCalls } = message
  const isDone = !isStreaming
  const hasContent = !!content

  // Show thinking dots only when streaming with no content yet
  const showThinkingDots = isStreaming && !hasContent &&
    (streamingPhase === 'waiting' || streamingPhase === 'thinking' || !streamingPhase)

  // Show tools indicator during tools phase
  const showToolsIndicator = isStreaming && streamingPhase === 'tools'

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Bot className="h-3 w-3 text-ledger-gray-400" />
        <span className="text-xs font-medium text-ledger-gray-500">Knowlex</span>
      </div>
      <div className="pl-0.5">
        {/* Thinking indicator — only when no content has arrived yet */}
        {showThinkingDots && <StreamingIndicator />}

        {/* Tools indicator */}
        {showToolsIndicator && (
          <div className="space-y-2 mb-2">
            <ToolsIndicator toolCalls={toolCalls} />
            {toolCalls && toolCalls.length > 0 && <ToolCallsCollapsible toolCalls={toolCalls} />}
          </div>
        )}

        {/* Done — show tool calls summary */}
        {isDone && toolCalls && toolCalls.length > 0 && (
          <ToolCallsCollapsible toolCalls={toolCalls} />
        )}

        {/* Content — render formatted markdown whenever content exists */}
        {hasContent && (
          <div className="text-sm text-kx-primary-900">
            <MarkdownRenderer content={content} />
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-kx-primary-400 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ResearchMessageBubble({ message }: { message: ResearchMessage }) {
  return message.role === 'user' ? <UserBubble message={message} /> : <AgentBubble message={message} />
}

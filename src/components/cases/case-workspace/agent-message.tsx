import { User, Bot } from 'lucide-react'
import type { AgentMessage as AgentMessageType } from '@/types'
import { cn } from '@/lib/utils'
import { AgentToolCallCard } from './agent-tool-call-card'

interface AgentMessageProps {
  message: AgentMessageType
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const PHASE_LABELS: Record<string, string> = {
  waiting: 'Preparing...',
  thinking: 'Thinking...',
  tools: 'Working...',
  answering: 'Writing...',
}

function renderMarkdownContent(text: string) {
  return text.split('\n').map((line, i, arr) => {
    // Handle bold text (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g)
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            )
          }
          // Handle inline code (`code`)
          if (part.includes('`')) {
            const codeParts = part.split(/(`[^`]+`)/g)
            return codeParts.map((cp, k) => {
              if (cp.startsWith('`') && cp.endsWith('`')) {
                return (
                  <code key={k} className="px-1 py-0.5 rounded bg-ledger-gray-100 text-kx-primary-800 text-xs font-mono">
                    {cp.slice(1, -1)}
                  </code>
                )
              }
              return cp
            })
          }
          return part
        })}
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

export function AgentMessage({ message }: AgentMessageProps) {
  const isUser = message.role === 'user'
  const content = message.content || ''
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-kx-primary-600' : 'bg-gradient-to-br from-kx-primary-500 to-kx-primary-700'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-ledger-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-[85%] gap-1.5',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Streaming phase indicator */}
        {message.isStreaming && message.streamingPhase && !content && (
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kx-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-kx-primary-500" />
            </span>
            <span className="text-xs text-ledger-gray-500">
              {PHASE_LABELS[message.streamingPhase] || 'Processing...'}
            </span>
          </div>
        )}

        {/* Tool call cards */}
        {hasToolCalls && !isUser && (
          <div className="w-full space-y-1.5">
            {message.toolCalls!.map((tc, idx) => (
              <AgentToolCallCard
                key={`${tc.name}-${idx}`}
                toolCall={tc}
              />
            ))}
          </div>
        )}

        {/* Main content bubble */}
        {content && (
          <div
            className={cn(
              'px-4 py-3 rounded-lg',
              isUser
                ? 'bg-gradient-to-br from-kx-primary-600 to-kx-primary-700 text-ledger-white'
                : 'bg-kx-card border border-kx-card-border text-kx-primary-900'
            )}
          >
            <div className="text-sm whitespace-pre-wrap">
              {renderMarkdownContent(content)}
            </div>

            {/* Streaming cursor */}
            {message.isStreaming && message.streamingPhase === 'answering' && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-kx-primary-500 animate-pulse rounded-sm" />
            )}
          </div>
        )}

        {/* Timestamp */}
        {!message.isStreaming && (
          <span className="text-xs text-ledger-gray-400">
            {formatTime(message.timestamp)}
          </span>
        )}

        {/* Streaming phase label under content */}
        {message.isStreaming && content && message.streamingPhase && (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kx-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-kx-primary-500" />
            </span>
            <span className="text-xs text-ledger-gray-400">
              {PHASE_LABELS[message.streamingPhase] || 'Processing...'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

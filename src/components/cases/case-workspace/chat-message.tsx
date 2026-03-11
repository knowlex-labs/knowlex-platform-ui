import { useState } from 'react'
import { User, Bot, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkspaceMessage } from '@/types'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: WorkspaceMessage
}

interface ParsedSource {
  fileName: string
  page: string
  snippet: string
}

function parseMessageContent(content: string): { mainContent: string; sources: ParsedSource[] } {
  // Look for the sources section
  const sourcesMatch = content.match(/\n\n\*\*Sources:\*\*\n([\s\S]*)$/)

  if (!sourcesMatch) {
    return { mainContent: content, sources: [] }
  }

  const mainContent = content.replace(sourcesMatch[0], '').trim()
  const sourcesText = sourcesMatch[1]

  // Parse individual sources: - filename (p.X): "snippet"
  const sourceRegex = /- (.+?) \(p\.(\d+)\): "(.+?)"/g
  const sources: ParsedSource[] = []
  let match

  while ((match = sourceRegex.exec(sourcesText)) !== null) {
    sources.push({
      fileName: match[1],
      page: match[2],
      snippet: match[3],
    })
  }

  return { mainContent, sources }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function stripInjectedContext(content: string): string {
  // Strip system-injected blocks appended to user messages.
  // Try multiple possible delimiters the backend might store.
  const delimiters = [
    '\n\n---\n',
    '\n---\n',
    '\n---',
    'RESPONSE INSTRUCTIONS:',
  ]
  for (const d of delimiters) {
    const idx = content.indexOf(d)
    if (idx !== -1) return content.slice(0, idx).trim()
  }
  return content
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false)
  const isUser = message.role === 'user'
  const rawContent = message.content || ''
  const content = isUser ? stripInjectedContext(rawContent) : rawContent
  const isToolExecution = content.startsWith('[Executing tool:')

  const { mainContent, sources } = parseMessageContent(content)
  const hasSources = sources.length > 0

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
          'flex flex-col max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-3 rounded-lg',
            isUser
              ? 'bg-gradient-to-br from-kx-primary-600 to-kx-primary-700 text-ledger-white'
              : 'bg-kx-card border border-kx-card-border text-kx-primary-900',
            isToolExecution && 'bg-ledger-gray-50 border border-ledger-gray-200 italic text-sm'
          )}
        >
          {/* Render main message content with basic markdown support */}
          <div className="text-sm whitespace-pre-wrap">
            {mainContent.split('\n').map((line, i) => {
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
                    return part
                  })}
                  {i < mainContent.split('\n').length - 1 && <br />}
                </span>
              )
            })}
          </div>
        </div>

        {/* Sources Section */}
        {hasSources && !isUser && (
          <div className="mt-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
              className="h-7 px-2 gap-1.5 text-xs text-ledger-gray-600 hover:text-kx-primary-700"
            >
              <FileText className="h-3.5 w-3.5" />
              {sources.length} source{sources.length !== 1 ? 's' : ''}
              {sourcesExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            {sourcesExpanded && (
              <div className="mt-2 space-y-2">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-kx-card-border bg-kx-card"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="h-3.5 w-3.5 text-ledger-gray-500" />
                      <span className="text-xs font-medium text-kx-primary-900 truncate">
                        {source.fileName}
                      </span>
                      <span className="text-xs text-ledger-gray-500 flex-shrink-0">
                        Page {source.page}
                      </span>
                    </div>
                    <p className="text-xs text-ledger-gray-600 italic line-clamp-2">
                      "{source.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-ledger-gray-400">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

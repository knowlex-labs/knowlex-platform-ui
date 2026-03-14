import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ArrowUp, Loader2, FileCheck, MessageSquareDot, Search, ChevronDown, ChevronRight, Wrench } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkdownRenderer } from '@/components/ai-research/markdown-renderer'
import { StreamingIndicator } from '@/components/ai-research/streaming-indicator'
import type { DraftChatMessage } from '@/types'

// Tool calls collapsible section
function ToolCallsCollapsible({
  toolCalls,
}: {
  toolCalls: NonNullable<DraftChatMessage['toolCalls']>
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-ledger-gray-500 hover:text-ledger-gray-700 transition-colors"
      >
        <Wrench className="h-3 w-3" />
        <span>
          Used {toolCalls.length} tool{toolCalls.length > 1 ? 's' : ''}
        </span>
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

function ToolsIndicator({ toolCalls }: { toolCalls?: DraftChatMessage['toolCalls'] }) {
  const name = toolCalls?.[toolCalls.length - 1]?.name
  return (
    <span className="inline-flex items-center gap-1.5 text-ledger-gray-400 text-xs">
      <Search className="h-3 w-3 animate-pulse" />
      <span>{name ? `Using ${name}...` : 'Searching case files...'}</span>
    </span>
  )
}

function stripInjectedContext(content: string): string {
  const delimiters = ['\n\n---\n', '\n---\n', '\n---', 'RESPONSE INSTRUCTIONS:']
  for (const d of delimiters) {
    const idx = content.indexOf(d)
    if (idx !== -1) return content.slice(0, idx).trim()
  }
  return content
}

function UserBubble({ message }: { message: DraftChatMessage }) {
  const displayContent = stripInjectedContext(message.content || '')
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        <div className="rounded-2xl rounded-br-sm bg-kx-primary-600 text-white px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
        </div>
      </div>
    </div>
  )
}

function AssistantBubble({ message }: { message: DraftChatMessage }) {
  const { isStreaming, streamingPhase, content, toolCalls } = message
  const isDone = !isStreaming
  const hasContent = !!content

  const showThinkingDots =
    isStreaming && !hasContent && (streamingPhase === 'waiting' || !streamingPhase)
  const showToolsIndicator = isStreaming && streamingPhase === 'tools'

  return (
    <div>
      <div className="pl-0.5">
        {showThinkingDots && <StreamingIndicator />}

        {showToolsIndicator && (
          <div className="space-y-2 mb-2">
            <ToolsIndicator toolCalls={toolCalls} />
            {toolCalls && toolCalls.length > 0 && (
              <ToolCallsCollapsible toolCalls={toolCalls} />
            )}
          </div>
        )}

        {isDone && toolCalls && toolCalls.length > 0 && (
          <ToolCallsCollapsible toolCalls={toolCalls} />
        )}

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

interface DraftChatInterfaceProps {
  messages: DraftChatMessage[]
  isStreaming: boolean
  isLoadingHistory: boolean
  selectedSourceCount: number
  indexingCount?: number
  onSendMessage: (message: string) => Promise<void>
  showGreeting?: boolean
}

function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const greetingTemplates = [
  { heading: (t: string, name: string) => `${t}, ${name}`, subtitle: 'Ask about your case documents, research case law, or get legal writing help' },
  { heading: (t: string, name: string) => `${t}, ${name}`, subtitle: 'Draft arguments, summarize judgments, or explore legal precedents' },
  { heading: (_t: string, _name: string) => 'How can I assist you today?', subtitle: 'I can help with case research, document analysis, and legal drafting' },
  { heading: (t: string, name: string) => `${t}, ${name}! Ready to work?`, subtitle: 'Upload documents, link judgments, or start a new draft' },
]

let greetingIndex = 0
function getNextGreeting() {
  const template = greetingTemplates[greetingIndex % greetingTemplates.length]
  greetingIndex++
  return template
}

export function DraftChatInterface({
  messages,
  isStreaming,
  isLoadingHistory,
  selectedSourceCount,
  indexingCount = 0,
  onSendMessage,
  showGreeting = false,
}: DraftChatInterfaceProps) {
  const { user } = useAuth()
  const displayName = user?.firstName || user?.username || 'Advocate'
  const [input, setInput] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isNearBottomRef = useRef(true)
  const greetingRef = useRef(getNextGreeting())

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '20px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  // Track whether user is near the bottom so we don't hijack manual scrolling
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  // ResizeObserver on content: fires as streaming adds tokens — no React dep needed
  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current) scrollToBottom()
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [scrollToBottom])

  // When a new message is added, always snap to bottom
  useEffect(() => {
    isNearBottomRef.current = true
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  // Rotate greeting template when chat is cleared / new session starts
  useEffect(() => {
    if (messages.length === 0) {
      greetingRef.current = getNextGreeting()
    }
  }, [messages.length])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    const query = input.trim()
    setInput('')
    await onSendMessage(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      {isLoadingHistory ? (
        <div className="flex-1 px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-3/4 ml-auto rounded-2xl" />
          <Skeleton className="h-16 w-4/5 rounded-2xl" />
          <Skeleton className="h-8 w-2/3 ml-auto rounded-2xl" />
          <Skeleton className="h-20 w-4/5 rounded-2xl" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {showGreeting ? (
            <>
              <h2 className="text-2xl font-semibold text-kx-primary-900 mb-2">
                {greetingRef.current.heading(getTimeGreeting(), displayName)}
              </h2>
              <p className="text-sm text-ledger-gray-400 max-w-[320px] leading-relaxed">
                {greetingRef.current.subtitle}
              </p>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-kx-primary-500 to-kx-primary-700 flex items-center justify-center mb-4 shadow-lg">
                <MessageSquareDot className="h-6 w-6 text-white" />
              </div>
              <p className="text-base text-ledger-gray-700 dark:text-ledger-gray-300 font-semibold mb-2">
                Chat
              </p>
              <p className="text-sm text-ledger-gray-400 dark:text-ledger-gray-500 max-w-[280px] leading-relaxed">
                Ask about your documents, refine drafts, or get legal writing help
              </p>
            </>
          )}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 scroll-smooth"
          onScroll={handleScroll}
        >
          <div ref={contentRef} className="py-4 space-y-4">
            {messages.map((message) =>
              message.role === 'user' ? (
                <UserBubble key={message.id} message={message} />
              ) : (
                <AssistantBubble key={message.id} message={message} />
              )
            )}
          </div>
        </div>
      )}

      {/* Indexing notice */}
      {indexingCount > 0 && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400">
          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
          <span>
            {indexingCount === 1
              ? '1 document is being indexed — answers may be incomplete until ready'
              : `${indexingCount} documents are being indexed — answers may be incomplete until ready`}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-4 pt-2">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-kx-card-border bg-kx-card shadow-md backdrop-blur-sm focus-within:shadow-lg focus-within:border-kx-primary-400/30 transition-all min-w-0">
            {/* Source count badge */}
            <div className="flex items-center gap-1 text-xs text-ledger-gray-400 flex-shrink-0">
              <FileCheck className="h-3 w-3" />
              <span>{selectedSourceCount}</span>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your case..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-ledger-gray-800 placeholder:text-ledger-gray-400 resize-none overflow-y-auto p-0 m-0 align-middle"
              style={{ height: '20px', maxHeight: '150px', lineHeight: '20px', verticalAlign: 'middle' }}
              rows={1}
              disabled={isStreaming}
            />

            {/* Send button */}
            <button
              type="submit"
              className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-kx-primary-500 to-kx-primary-700 text-white hover:from-kx-primary-400 hover:to-kx-primary-600 shadow-sm disabled:opacity-40 mb-px"
              disabled={!input.trim() || isStreaming}
            >
              {isStreaming ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowUp className="h-3 w-3" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

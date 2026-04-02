import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ArrowUp, Loader2, MessageSquareDot, Search, ChevronDown, ChevronRight, Wrench, Plus, Paperclip, SlidersHorizontal, Wand2, X, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkdownRenderer } from '@/components/ai-research/markdown-renderer'
import { StreamingIndicator } from '@/components/ai-research/streaming-indicator'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import type { DraftChatMessage, DraftChatSettings, DraftChatModel } from '@/types'

const MODEL_OPTIONS: { value: DraftChatModel; label: string; short: string }[] = [
  { value: 'gemini_flash', label: 'Gemini 3.1 Flash', short: 'Flash' },
  { value: 'gemini_pro', label: 'Gemini 3.1 Pro', short: 'Gemini Pro' },
  { value: 'gpt_5_mini', label: 'GPT 5 Mini', short: 'GPT Mini' },
  { value: 'gpt_5', label: 'GPT 5 Pro', short: 'GPT Pro' },
]

interface TempAttachment {
  id: string
  name: string
  file: File
}

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
  indexingCount?: number
  settings: DraftChatSettings
  onSendMessage: (message: string) => Promise<void>
  onUpdateSettings: (updates: Partial<DraftChatSettings>) => void
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
  indexingCount = 0,
  settings,
  onSendMessage,
  onUpdateSettings,
  showGreeting = false,
}: DraftChatInterfaceProps) {
  const { user } = useAuth()
  const displayName = user?.firstName || user?.username || 'Advocate'
  const [input, setInput] = useState('')
  const [tempAttachments, setTempAttachments] = useState<TempAttachment[]>([])
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'tone' | 'style' | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current) scrollToBottom()
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [scrollToBottom])

  useEffect(() => {
    isNearBottomRef.current = true
    scrollToBottom()
  }, [messages.length, scrollToBottom])

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
    setTempAttachments([])
    // TODO: pass tempAttachments to onSendMessage when backend supports inline doc context
    await onSendMessage(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const newAttachments: TempAttachment[] = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      file,
    }))
    setTempAttachments((prev) => [...prev, ...newAttachments])
    e.target.value = ''
    setPlusMenuOpen(false)
  }

  const removeAttachment = (id: string) => {
    setTempAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const currentModel = MODEL_OPTIONS.find((m) => m.value === settings.model) ?? MODEL_OPTIONS[0]

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
              <div className="flex flex-col gap-2 mt-5 w-full max-w-[320px]">
                {['Summarize the key facts of this case', 'What are the relevant legal provisions?', 'Compare arguments from both sides'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-ledger-gray-200 text-ledger-gray-600 hover:border-kx-primary-300 hover:bg-kx-primary-50 hover:text-kx-primary-700 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
              <div className="flex flex-col gap-2 mt-5 w-full max-w-[280px]">
                {['Summarize the key facts', 'Find relevant legal provisions', 'Help refine my draft'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 text-ledger-gray-600 dark:text-ledger-gray-400 hover:border-kx-primary-300 hover:bg-kx-primary-50 dark:hover:bg-kx-primary-900/20 hover:text-kx-primary-700 dark:hover:text-kx-primary-400 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
      <div className="px-4 pb-4 pt-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="rounded-2xl border border-kx-card-border bg-kx-card shadow-md backdrop-blur-sm focus-within:shadow-lg focus-within:border-kx-primary-400/30 transition-all">
          {/* Attachment chips */}
          {tempAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
              {tempAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-kx-primary-50 border border-kx-primary-200 text-xs text-kx-primary-700"
                >
                  <Paperclip className="h-3 w-3 flex-shrink-0" />
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="ml-0.5 text-kx-primary-400 hover:text-kx-primary-700 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 px-3 py-2">
              {/* + button */}
              <PopoverPrimitive.Root open={plusMenuOpen} onOpenChange={(open) => { setPlusMenuOpen(open); if (!open) setExpandedSection(null) }}>
                <PopoverPrimitive.Trigger asChild>
                  <button
                    type="button"
                    className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center border border-ledger-gray-300 text-ledger-gray-500 hover:text-kx-primary-700 hover:border-kx-primary-400 transition-colors"
                    title="Attach documents, tone & style"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="z-50 w-64 rounded-xl border border-ledger-gray-200 bg-kx-card shadow-lg animate-in fade-in-0 zoom-in-95 p-2"
                  >
                    {/* Upload documents */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-ledger-gray-700 hover:bg-ledger-gray-100 transition-colors"
                    >
                      <Paperclip className="h-4 w-4 text-ledger-gray-500 flex-shrink-0" />
                      <span className="font-medium">Upload documents</span>
                      <span className="ml-auto text-xs text-ledger-gray-400">chat only</span>
                    </button>

                    <div className="my-1.5 border-t border-ledger-gray-100" />

                    {/* Tone */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expandedSection === 'tone' ? null : 'tone')}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-ledger-gray-700 hover:bg-ledger-gray-100 transition-colors"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-ledger-gray-500 flex-shrink-0" />
                        <span className="font-medium">Tone</span>
                        <span className="ml-auto text-xs text-kx-primary-600 capitalize">{settings.tone}</span>
                      </button>
                      {expandedSection === 'tone' && (
                        <div className="flex gap-1.5 px-3 pb-2">
                          {(['formal', 'neutral', 'conversational'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => { onUpdateSettings({ tone: t }); setExpandedSection(null) }}
                              className={cn(
                                'flex-1 text-xs py-1.5 rounded-md border transition-colors capitalize',
                                settings.tone === t
                                  ? 'bg-kx-primary-600 text-white border-kx-primary-600'
                                  : 'border-ledger-gray-200 text-ledger-gray-600 hover:bg-ledger-gray-50'
                              )}
                            >
                              {t === 'conversational' ? 'Conv.' : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Style */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expandedSection === 'style' ? null : 'style')}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-ledger-gray-700 hover:bg-ledger-gray-100 transition-colors"
                      >
                        <Wand2 className="h-4 w-4 text-ledger-gray-500 flex-shrink-0" />
                        <span className="font-medium">Style</span>
                        <span className="ml-auto text-xs text-kx-primary-600 capitalize">{settings.style}</span>
                      </button>
                      {expandedSection === 'style' && (
                        <div className="flex gap-1.5 px-3 pb-2">
                          {(['precise', 'balanced', 'detailed'] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { onUpdateSettings({ style: s }); setExpandedSection(null) }}
                              className={cn(
                                'flex-1 text-xs py-1.5 rounded-md border transition-colors capitalize',
                                settings.style === s
                                  ? 'bg-kx-primary-600 text-white border-kx-primary-600'
                                  : 'border-ledger-gray-200 text-ledger-gray-600 hover:bg-ledger-gray-50'
                              )}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <PopoverPrimitive.Arrow className="fill-kx-card" />
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your case..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-ledger-gray-800 dark:text-ledger-gray-200 placeholder:text-ledger-gray-400 resize-none overflow-y-auto p-0 m-0 align-middle"
                style={{ height: '20px', maxHeight: '150px', lineHeight: '20px', verticalAlign: 'middle' }}
                rows={1}
                disabled={isStreaming}
              />

              {/* Model selector */}
              <PopoverPrimitive.Root open={modelMenuOpen} onOpenChange={setModelMenuOpen}>
                <PopoverPrimitive.Trigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 flex-shrink-0 text-[10px] text-ledger-gray-400 hover:text-kx-primary-600 transition-colors"
                    title="Change model"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span className="hidden sm:inline">{currentModel.short}</span>
                  </button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    side="top"
                    align="end"
                    sideOffset={8}
                    className="z-50 w-44 rounded-xl border border-ledger-gray-200 bg-kx-card shadow-lg animate-in fade-in-0 zoom-in-95 p-1.5"
                  >
                    {MODEL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { onUpdateSettings({ model: opt.value }); setModelMenuOpen(false) }}
                        className={cn(
                          'flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-colors',
                          settings.model === opt.value
                            ? 'bg-kx-primary-50 text-kx-primary-700 font-medium'
                            : 'text-ledger-gray-700 hover:bg-ledger-gray-100'
                        )}
                      >
                        <span>{opt.label}</span>
                        {settings.model === opt.value && (
                          <span className="h-1.5 w-1.5 rounded-full bg-kx-primary-500" />
                        )}
                      </button>
                    ))}
                    <PopoverPrimitive.Arrow className="fill-kx-card" />
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>

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
    </div>
  )
}

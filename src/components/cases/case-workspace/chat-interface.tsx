import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Trash2, FileCheck, MessageSquare, Pencil, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AgentMessage, AgentMode } from '@/types'
import { AgentMessage as AgentMessageComponent } from './agent-message'

interface ChatInterfaceProps {
  messages: AgentMessage[]
  isStreaming: boolean
  error: string | null
  mode: AgentMode
  selectedSourceCount: number
  hasActiveDraft: boolean
  onSendMessage: (query: string) => void
  onCancelStream: () => void
  onClearChat: () => void
}

const PLACEHOLDERS: Record<AgentMode, string> = {
  ask: 'Ask about your documents...',
  edit: 'Tell me what to create or edit...',
}

export function ChatInterface({
  messages,
  isStreaming,
  error,
  mode,
  selectedSourceCount,
  hasActiveDraft,
  onSendMessage,
  onCancelStream,
  onClearChat,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return
    const query = input.trim()
    setInput('')
    onSendMessage(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const EmptyIcon = mode === 'ask' ? MessageSquare : Pencil

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-kx-primary-500 to-kx-primary-700 flex items-center justify-center mb-4 shadow-lg">
            <EmptyIcon className="h-6 w-6 text-white" />
          </div>
          <p className="text-base text-ledger-gray-700 dark:text-ledger-gray-300 font-semibold mb-2">
            {mode === 'ask' ? 'Ask anything' : 'Create & edit'}
          </p>
          <p className="text-sm text-ledger-gray-400 dark:text-ledger-gray-500 max-w-[320px] leading-relaxed">
            {mode === 'ask'
              ? 'Ask questions about your documents or case details'
              : 'Ask the agent to generate drafts, edit files, or create new documents'}
          </p>
          {mode === 'edit' && !hasActiveDraft && (
            <p className="text-xs text-ledger-gray-400 mt-3 max-w-[280px]">
              Tip: Open a draft to let the agent edit it, or ask it to create a new one
            </p>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <AgentMessageComponent
                key={message.id}
                message={message}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-end gap-2.5 px-4 py-2.5 rounded-2xl border border-kx-card-border bg-kx-card shadow-md backdrop-blur-sm focus-within:shadow-lg focus-within:border-kx-primary-400/30 transition-all min-w-0">
          {/* Clear chat button */}
          {messages.length > 0 && !isStreaming && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-ledger-gray-400 hover:text-kx-primary-700 flex-shrink-0 mb-0.5"
              onClick={onClearChat}
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Source count badge */}
          <div className="flex items-center gap-1.5 text-xs text-ledger-gray-400 flex-shrink-0 mb-1">
            <FileCheck className="h-3 w-3" />
            <span>{selectedSourceCount}</span>
          </div>

          {/* Textarea input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[mode]}
            className="flex-1 bg-transparent border-none outline-none text-sm text-ledger-gray-800 dark:text-ledger-gray-200 placeholder:text-ledger-gray-400 dark:placeholder:text-ledger-gray-500 resize-none min-h-[24px] max-h-[120px] py-0.5"
            rows={1}
            disabled={isStreaming}
          />

          {/* Send / Stop button */}
          {isStreaming ? (
            <Button
              type="button"
              size="sm"
              className="h-8 w-8 p-0 rounded-full flex-shrink-0 bg-red-500 text-white hover:bg-red-600 shadow-md mb-0.5"
              onClick={onCancelStream}
              title="Stop generating"
            >
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-8 w-8 p-0 rounded-full flex-shrink-0 bg-gradient-to-br from-kx-primary-500 to-kx-primary-700 text-white hover:from-kx-primary-400 hover:to-kx-primary-600 shadow-md mb-0.5"
              disabled={!input.trim()}
              onClick={handleSubmit}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Trash2, Loader2, FileCheck, MessageSquare } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { WorkspaceMessage } from '@/types'
import { ChatMessage } from './chat-message'

interface ChatInterfaceProps {
  messages: WorkspaceMessage[]
  isLoading: boolean
  selectedSourceCount: number
  onSendMessage: (query: string) => Promise<void>
  onClearChat: () => void
}

export function ChatInterface({
  messages,
  isLoading,
  selectedSourceCount,
  onSendMessage,
  onClearChat,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to fit content (starts at 20px single line)
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '20px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Adjust height whenever input changes
  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

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
      {/* Messages */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-kx-primary-500 to-kx-primary-700 flex items-center justify-center mb-4 shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <p className="text-base text-ledger-gray-700 dark:text-ledger-gray-300 font-semibold mb-2">
            Start a conversation
          </p>
          <p className="text-sm text-ledger-gray-400 dark:text-ledger-gray-500 max-w-[320px] leading-relaxed">
            Ask questions about your documents or send text from your drafts
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-ledger-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <div className="px-5 pb-4 pt-2">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-kx-card-border bg-kx-card shadow-md backdrop-blur-sm focus-within:shadow-lg focus-within:border-kx-primary-400/30 transition-all min-w-0">
            {/* Clear chat button */}
            {messages.length > 0 && (
              <button
                type="button"
                className="h-5 w-5 flex items-center justify-center text-ledger-gray-400 hover:text-kx-primary-700 flex-shrink-0"
                onClick={onClearChat}
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Source count badge */}
            <div className="flex items-center gap-1 text-xs text-ledger-gray-400 flex-shrink-0">
              <FileCheck className="h-3 w-3" />
              <span>{selectedSourceCount}</span>
            </div>

            {/* Textarea field */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your case..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-ledger-gray-800 placeholder:text-ledger-gray-400 resize-none overflow-y-auto p-0 m-0 align-middle"
              style={{ height: '20px', maxHeight: '150px', lineHeight: '20px', verticalAlign: 'middle' }}
              rows={1}
              disabled={isLoading}
            />

            {/* Send button */}
            <button
              type="submit"
              className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-kx-primary-500 to-kx-primary-700 text-white hover:from-kx-primary-400 hover:to-kx-primary-600 shadow-sm disabled:opacity-40 mb-px"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
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

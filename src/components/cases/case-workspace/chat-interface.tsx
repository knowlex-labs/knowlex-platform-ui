import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Trash2, Loader2, FileCheck, Paperclip, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput('')
    await onSendMessage(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
          <p className="text-base text-ledger-gray-700 font-semibold mb-2">
            Start a conversation
          </p>
          <p className="text-sm text-ledger-gray-400 max-w-[320px] leading-relaxed">
            Ask questions about your documents or use the tools on the right to analyze them
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
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-kx-card-border bg-kx-card shadow-md backdrop-blur-sm focus-within:shadow-lg focus-within:border-kx-primary-400/30 transition-all">
            {/* File upload button */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => {
                // Handle file upload here
                const file = e.target.files?.[0]
                if (file) {
                  console.log('File selected:', file.name)
                  // TODO: Integrate with upload handler
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-ledger-gray-400 hover:text-kx-primary-700 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Clear chat button */}
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-ledger-gray-400 hover:text-kx-primary-700 flex-shrink-0"
                onClick={onClearChat}
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Source count badge */}
            <div className="flex items-center gap-1.5 text-xs text-ledger-gray-400 flex-shrink-0">
              <FileCheck className="h-3 w-3" />
              <span>{selectedSourceCount}</span>
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your documents..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-ledger-gray-800 placeholder:text-ledger-gray-400"
              disabled={isLoading}
            />

            {/* Send button */}
            <Button
              type="submit"
              size="sm"
              className="h-8 w-8 p-0 rounded-full flex-shrink-0 bg-gradient-to-br from-kx-primary-500 to-kx-primary-700 text-white hover:from-kx-primary-400 hover:to-kx-primary-600 shadow-md"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

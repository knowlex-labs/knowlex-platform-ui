import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Loader2, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { WorkspaceMessage } from '@/types'
import { ChatMessage } from './chat-message'

interface ChatPanelProps {
  messages: WorkspaceMessage[]
  isLoading: boolean
  selectedSourceCount: number
  onSendMessage: (query: string) => Promise<void>
  onClearChat: () => void
  onEditDraft?: (content: string) => void
}

export function ChatPanel({
  messages,
  isLoading,
  selectedSourceCount,
  onSendMessage,
  onClearChat,
  onEditDraft,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-ledger-white border border-ledger-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-gray-200">
        <h3 className="text-sm font-semibold text-ledger-black">Chat</h3>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearChat}
            className="h-8 gap-2 text-ledger-gray-500 hover:text-ledger-black"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-ledger-gray-100 flex items-center justify-center mb-4">
              <Send className="h-5 w-5 text-ledger-gray-400" />
            </div>
            <p className="text-sm text-ledger-gray-500 mb-1">
              Start a conversation
            </p>
            <p className="text-xs text-ledger-gray-400 max-w-[200px]">
              Ask questions about your documents or use the tools panel to analyze them
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} onEditDraft={onEditDraft} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-ledger-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-ledger-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your documents..."
              className="min-h-[80px] pr-12 resize-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-ledger-gray-400">
              <FileCheck className="h-3.5 w-3.5" />
              {selectedSourceCount} source{selectedSourceCount !== 1 ? 's' : ''} selected
            </div>
            <p className="text-xs text-ledger-gray-400">
              Press Enter to send
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

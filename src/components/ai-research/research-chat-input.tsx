import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ResearchChatInputProps {
  onSendMessage: (content: string) => void
  onCancelStream?: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ResearchChatInput({
  onSendMessage,
  onCancelStream,
  isStreaming,
  disabled,
}: ResearchChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isMultiline = input.includes('\n') || (textareaRef.current && textareaRef.current.scrollHeight > 48)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || disabled) return
    onSendMessage(input)
    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming) return
      handleSubmit()
    }
  }

  const handleFileClick = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.click()
  }

  return (
    <div className="p-4 pb-6">
      <div className="max-w-2xl mx-auto">
        <div
          className={cn(
            'flex items-end gap-2 border bg-ledger-gray-50 transition-all',
            'focus-within:bg-white focus-within:ring-1 focus-within:ring-ledger-gray-300',
            isMultiline ? 'rounded-2xl' : 'rounded-full',
            'px-3 py-2'
          )}
        >
          {/* Paperclip */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 flex-shrink-0 text-ledger-gray-400 hover:text-ledger-gray-600"
            onClick={handleFileClick}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a legal question..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2 placeholder:text-ledger-gray-400 max-h-[200px] min-h-[36px]"
            disabled={disabled}
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 flex-shrink-0 text-ledger-gray-600 hover:text-ledger-black"
              onClick={onCancelStream}
              title="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-9 w-9 flex-shrink-0 bg-ledger-black text-white hover:bg-ledger-gray-800 rounded-full disabled:opacity-30"
              onClick={handleSubmit}
              disabled={!input.trim() || disabled}
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-ledger-gray-400 text-center mt-2">
          Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  )
}

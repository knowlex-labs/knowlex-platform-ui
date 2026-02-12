import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
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
  const isMultiline = input.includes('\n') || (textareaRef.current && textareaRef.current.scrollHeight > 44)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || disabled) return
    onSendMessage(input)
    setInput('')
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
    <div className="px-4 py-3">
      <div className="max-w-xl mx-auto">
        <div
          className={cn(
            'flex items-end gap-1.5 border border-ledger-gray-200 bg-white transition-all shadow-sm',
            'focus-within:border-ledger-gray-300 focus-within:shadow-md',
            isMultiline ? 'rounded-xl' : 'rounded-full',
            'px-2 py-1.5'
          )}
        >
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center flex-shrink-0 text-ledger-gray-400 hover:text-ledger-gray-600 transition-colors rounded-full"
            onClick={handleFileClick}
            title="Attach file"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a legal question..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-1 placeholder:text-ledger-gray-400 max-h-[160px] min-h-[28px] leading-5"
            disabled={disabled}
          />

          {isStreaming ? (
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center flex-shrink-0 text-ledger-gray-500 hover:text-ledger-black transition-colors rounded-full"
              onClick={onCancelStream}
              title="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center flex-shrink-0 bg-ledger-black text-white rounded-full disabled:opacity-30 hover:bg-ledger-gray-800 transition-colors"
              onClick={handleSubmit}
              disabled={!input.trim() || disabled}
              title="Send message"
            >
              <Send className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-ledger-gray-400 text-center mt-1.5">
          Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  )
}

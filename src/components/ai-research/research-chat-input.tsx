import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResearchChatInputProps {
  onSendMessage: (content: string) => void
  onCancelStream?: () => void
  isStreaming: boolean
  disabled?: boolean
  variant?: 'default' | 'hero'
}

export function ResearchChatInput({
  onSendMessage,
  onCancelStream,
  isStreaming,
  disabled,
  variant = 'default',
}: ResearchChatInputProps) {
  const isHero = variant === 'hero'
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

  const btnSize = isHero ? 'h-9 w-9' : 'h-8 w-8'
  const iconSize = isHero ? 'h-4 w-4' : 'h-3.5 w-3.5'

  return (
    <div className={cn('px-4 py-3', !isHero && 'border-t border-ledger-gray-100')}>
      <div className={cn(!isHero && 'max-w-2xl mx-auto')}>
        <div
          className={cn(
            'flex items-end gap-2 border border-ledger-gray-200 bg-white transition-all',
            isHero
              ? 'shadow-md focus-within:shadow-lg focus-within:border-ledger-gray-300'
              : 'shadow-sm focus-within:shadow-md focus-within:border-ledger-gray-300',
            isMultiline ? 'rounded-xl' : 'rounded-full',
            isHero ? 'px-3 py-2' : 'px-2 py-1.5'
          )}
        >
          <button
            type="button"
            className={cn(btnSize, 'flex items-center justify-center flex-shrink-0 text-ledger-gray-400 hover:text-ledger-gray-600 transition-colors rounded-full')}
            onClick={handleFileClick}
            title="Attach file"
          >
            <Paperclip className={iconSize} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isHero ? 'Ask about case law, statutes, or legal concepts...' : 'Ask a legal question...'}
            rows={1}
            className={cn(
              'flex-1 bg-transparent border-none outline-none resize-none py-1 placeholder:text-ledger-gray-400 max-h-[160px] min-h-[28px] leading-5',
              isHero ? 'text-base' : 'text-sm'
            )}
            disabled={disabled}
          />

          {isStreaming ? (
            <button
              type="button"
              className={cn(btnSize, 'flex items-center justify-center flex-shrink-0 text-ledger-gray-500 hover:text-ledger-black transition-colors rounded-full')}
              onClick={onCancelStream}
              title="Stop generating"
            >
              <Square className={cn(iconSize, 'fill-current')} />
            </button>
          ) : (
            <button
              type="button"
              className={cn(btnSize, 'flex items-center justify-center flex-shrink-0 bg-ledger-black text-white rounded-full disabled:opacity-30 hover:bg-ledger-gray-800 transition-colors')}
              onClick={handleSubmit}
              disabled={!input.trim() || disabled}
              title="Send message"
            >
              <Send className={isHero ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
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

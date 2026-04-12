import { useEffect, useRef, useCallback } from 'react'
import { ResearchMessageBubble } from './research-message-bubble'
import type { ResearchMessage } from '@knowlex/core/types'

interface ResearchMessageListProps {
  messages: ResearchMessage[]
}

export function ResearchMessageList({ messages }: ResearchMessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Detect user scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      userScrolledRef.current = !isNearBottom
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll on new messages unless user scrolled up
  useEffect(() => {
    if (!userScrolledRef.current) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {messages.map((message) => (
          <ResearchMessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

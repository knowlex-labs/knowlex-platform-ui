import { useState, useRef, useCallback, useEffect } from 'react'
import type { AgentMessage, AgentMode, AgentStreamingPhase, AgentToolCall } from '@/types'
import { agentApi } from '@/services/api/agent-api'
import type { AgentRequestPayload } from '@/services/api/agent-api'

function generateId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

interface UseWorkspaceAgentOptions {
  caseId: string
  getSourceIds: () => string[]
  getActiveDraftContent: () => string | null
  onDraftUpdated: (html: string) => void
}

interface UseWorkspaceAgentResult {
  messages: AgentMessage[]
  isStreaming: boolean
  error: string | null
  mode: AgentMode
  setMode: (mode: AgentMode) => void
  sendMessage: (content: string) => void
  cancelStream: () => void
  clearChat: () => void
}

export function useWorkspaceAgent(options: UseWorkspaceAgentOptions): UseWorkspaceAgentResult {
  const {
    caseId,
    getSourceIds,
    getActiveDraftContent,
    onDraftUpdated,
  } = options

  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<AgentMode>('ask')

  const abortControllerRef = useRef<AbortController | null>(null)

  // Streaming refs (same pattern as use-research-chat.ts)
  const thinkingContentRef = useRef('')
  const answerContentRef = useRef('')
  const editBufferRef = useRef('')
  const toolCallsRef = useRef<AgentToolCall[]>([])
  const phaseRef = useRef<AgentStreamingPhase>('waiting')
  const streamingMsgIdRef = useRef<string | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const activeModeRef = useRef<AgentMode>('ask')

  // Stable ref for callback
  const onDraftUpdatedRef = useRef(onDraftUpdated)
  onDraftUpdatedRef.current = onDraftUpdated

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isStreaming) return

    setError(null)

    // Build full conversation history
    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const payload: AgentRequestPayload = {
      mode,
      message: trimmed,
      source_ids: getSourceIds(),
      conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
    }

    // In edit mode, include active draft content
    if (mode === 'edit') {
      const draftContent = getActiveDraftContent()
      if (draftContent) {
        payload.active_draft_content = draftContent
      }
    }

    const userMessage: AgentMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      mode,
    }

    const assistantId = generateId()
    const assistantMessage: AgentMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      mode,
      isStreaming: true,
      streamingPhase: 'waiting',
    }

    thinkingContentRef.current = ''
    answerContentRef.current = ''
    editBufferRef.current = ''
    toolCallsRef.current = []
    phaseRef.current = 'waiting'
    streamingMsgIdRef.current = assistantId
    activeModeRef.current = mode

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsStreaming(true)

    const flushStreamContent = () => {
      const msgId = streamingMsgIdRef.current
      if (!msgId) return

      if (activeModeRef.current === 'edit') {
        // In edit mode, show a progress indicator instead of streaming content
        const progressText = editBufferRef.current.length > 0
          ? 'Generating draft...'
          : ''
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  content: progressText,
                  streamingPhase: phaseRef.current,
                  toolCalls: toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined,
                }
              : msg
          )
        )
      } else {
        // Ask mode: stream content normally
        const content = answerContentRef.current || thinkingContentRef.current
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  content,
                  streamingPhase: phaseRef.current,
                  toolCalls: toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined,
                }
              : msg
          )
        )
      }
      rafIdRef.current = null
    }

    const scheduleFlush = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushStreamContent)
      }
    }

    const unescapeToken = (t: string) => t.replace(/\\n/g, '\n').replace(/\\t/g, '\t')

    const controller = agentApi.sendMessage(caseId, payload, {
      onThinking: (token) => {
        phaseRef.current = 'thinking'
        thinkingContentRef.current += unescapeToken(token)
        scheduleFlush()
      },
      onToolCall: (data) => {
        phaseRef.current = 'tools'
        try {
          const parsed = JSON.parse(data)
          toolCallsRef.current = [
            ...toolCallsRef.current,
            { name: parsed.name, args: parsed.args },
          ]
          scheduleFlush()
        } catch {
          /* ignore malformed */
        }
      },
      onToolResult: (data) => {
        try {
          const parsed = JSON.parse(data)

          // Update the last tool call with its result
          if (toolCallsRef.current.length > 0) {
            const updated = [...toolCallsRef.current]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              result: parsed.result ?? parsed,
            }
            toolCallsRef.current = updated
            scheduleFlush()
          }
        } catch {
          // If not JSON, try to set as raw result on last tool call
          if (toolCallsRef.current.length > 0) {
            const updated = [...toolCallsRef.current]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              result: { raw: data },
            }
            toolCallsRef.current = updated
            scheduleFlush()
          }
        }
      },
      onAnswer: (token) => {
        phaseRef.current = 'answering'
        if (activeModeRef.current === 'edit') {
          // Buffer silently for edit mode
          editBufferRef.current += unescapeToken(token)
          scheduleFlush()
        } else {
          // Stream into chat for ask mode
          answerContentRef.current += unescapeToken(token)
          scheduleFlush()
        }
      },
      onEnd: () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }

        const msgId = streamingMsgIdRef.current

        if (activeModeRef.current === 'edit' && editBufferRef.current) {
          // Apply buffered HTML to the draft
          onDraftUpdatedRef.current(editBufferRef.current)

          // Show confirmation in chat
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === msgId
                ? {
                    ...msg,
                    content: 'Draft updated successfully.',
                    toolCalls: toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined,
                    isStreaming: false,
                    streamingPhase: undefined,
                  }
                : msg
            )
          )
        } else {
          // Ask mode: finalize with streamed content
          const finalContent = answerContentRef.current || thinkingContentRef.current
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === msgId
                ? {
                    ...msg,
                    content: finalContent,
                    toolCalls: toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined,
                    isStreaming: false,
                    streamingPhase: undefined,
                  }
                : msg
            )
          )
        }

        setIsStreaming(false)
        streamingMsgIdRef.current = null
        abortControllerRef.current = null
      },
      onError: (errorMsg) => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        const finalContent = activeModeRef.current === 'edit'
          ? 'An error occurred while generating the draft.'
          : (answerContentRef.current || thinkingContentRef.current || 'An error occurred.')
        const finalToolCalls =
          toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined
        const msgId = streamingMsgIdRef.current
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  content: finalContent,
                  toolCalls: finalToolCalls,
                  isStreaming: false,
                  streamingPhase: undefined,
                }
              : msg
          )
        )
        setIsStreaming(false)
        setError(errorMsg)
        streamingMsgIdRef.current = null
        abortControllerRef.current = null
      },
    })

    abortControllerRef.current = controller
  }, [caseId, isStreaming, messages, mode, getSourceIds, getActiveDraftContent])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    // In edit mode, discard the buffer
    const finalContent = activeModeRef.current === 'edit'
      ? 'Draft generation cancelled.'
      : (answerContentRef.current || thinkingContentRef.current)
    const finalToolCalls =
      toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined
    const msgId = streamingMsgIdRef.current
    setIsStreaming(false)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? {
              ...msg,
              content: finalContent || msg.content,
              toolCalls: finalToolCalls,
              isStreaming: false,
              streamingPhase: undefined,
            }
          : msg.isStreaming
          ? { ...msg, isStreaming: false, streamingPhase: undefined }
          : msg
      )
    )
    streamingMsgIdRef.current = null
  }, [])

  const clearChat = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    setMessages([])
    setIsStreaming(false)
    setError(null)
    streamingMsgIdRef.current = null
  }, [])

  return {
    messages,
    isStreaming,
    error,
    mode,
    setMode,
    sendMessage,
    cancelStream,
    clearChat,
  }
}

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ResearchMessage, ResearchSession, ResearchSettings, StreamingPhase, ToolCall, Citation } from '@/types'
import { researchApi } from '@/services/api/research-api'

const SETTINGS_STORAGE_KEY = 'knowlex_chat_settings'

/**
 * Parse citations from tool result text when no explicit citations SSE event arrives.
 * Matches the pattern: [N] Title\nSource: X\nURL: Y
 */
function parseCitationsFromToolResults(toolCalls: ToolCall[]): Citation[] {
  const citations: Citation[] = []
  for (const tc of toolCalls) {
    if (!tc.result) continue
    // Unescape literal \n from SSE encoding, also handle content='...' wrapper
    const text = tc.result.replace(/\\n/g, '\n')
    const pattern = /\[(\d+)\]\s*(.+?)\nSource:\s*(.+?)\nURL:\s*(\S+)/g
    let m
    while ((m = pattern.exec(text)) !== null) {
      citations.push({
        id: parseInt(m[1], 10),
        case_name: m[2].trim(),
        source: m[3].trim(),
        url: m[4].trim(),
      })
    }
  }
  citations.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  return citations
}

const VALID_MODELS = ['openai', 'gemini'] as const
const DEFAULT_MODEL = 'openai'

const DEFAULT_SETTINGS: ResearchSettings = {
  creativity: 'balanced',
  model: DEFAULT_MODEL,
  knowledgeBaseEnabled: true,
}

function loadSettings(): ResearchSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    const parsed = JSON.parse(stored)
    const model = VALID_MODELS.includes(parsed.model as (typeof VALID_MODELS)[number])
      ? parsed.model
      : DEFAULT_MODEL
    const settings: ResearchSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      model,
      knowledgeBaseEnabled: parsed.knowledgeBaseEnabled === true,
    }
    if (model !== parsed.model) {
      persistSettings(settings)
    }
    return settings
  } catch {
    return DEFAULT_SETTINGS
  }
}

function persistSettings(settings: ResearchSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function useResearchChat() {
  const [sessions, setSessions] = useState<ResearchSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ResearchMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<ResearchSettings>(() => loadSettings())

  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstMessageRef = useRef(true)

  // Streaming refs
  const thinkingContentRef = useRef('')
  const answerContentRef = useRef('')
  const toolCallsRef = useRef<ToolCall[]>([])
  const citationsRef = useRef<Citation[]>([])
  const phaseRef = useRef<StreamingPhase>('waiting')
  const streamingMsgIdRef = useRef<string | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // Load sessions from API on mount
  useEffect(() => {
    let cancelled = false

    const fetchSessions = async () => {
      setIsLoadingSessions(true)
      try {
        const sessionIds = await researchApi.getSessions()

        if (cancelled) return

        // For each session, fetch history to derive a title from the first user message
        const sessionPromises = sessionIds.map(async (id) => {
          try {
            const history = await researchApi.getHistory(id)
            const firstUserMsg = history.find((m) => m.role === 'user')
            const title = firstUserMsg
              ? firstUserMsg.content.length > 50
                ? firstUserMsg.content.substring(0, 50) + '...'
                : firstUserMsg.content
              : 'New Chat'
            return { id, title, createdAt: new Date() } as ResearchSession
          } catch {
            return { id, title: 'New Chat', createdAt: new Date() } as ResearchSession
          }
        })

        const loaded = await Promise.all(sessionPromises)
        if (!cancelled) {
          setSessions(loaded)
        }
      } catch {
        // Silently fail — user just sees empty sidebar
      } finally {
        if (!cancelled) setIsLoadingSessions(false)
      }
    }

    fetchSessions()

    return () => {
      cancelled = true
    }
  }, [])

  // Clear on auth expiry
  useEffect(() => {
    const handleExpired = () => {
      setActiveSessionId(null)
      setMessages([])
    }
    window.addEventListener('auth:session-expired', handleExpired)
    return () => window.removeEventListener('auth:session-expired', handleExpired)
  }, [])

  // Load history when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }

    // Don't wipe messages if we're mid-stream (first message auto-created the session)
    if (streamingMsgIdRef.current) return

    let cancelled = false
    isFirstMessageRef.current = true

    const loadHistory = async () => {
      setIsLoadingHistory(true)
      setError(null)
      try {
        const history = await researchApi.getHistory(activeSessionId)
        if (cancelled) return

        const mapped: ResearchMessage[] = history.map((msg, i) => ({
          id: `hist-${activeSessionId}-${i}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(),
          toolCalls: msg.toolCalls,
        }))
        setMessages(mapped)

        if (mapped.length > 0) {
          isFirstMessageRef.current = false
        }
      } catch {
        if (cancelled) return
        setMessages([])
      } finally {
        if (!cancelled) setIsLoadingHistory(false)
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [activeSessionId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isStreaming) return

    let sessionId = activeSessionId

    // Auto-create session if needed
    if (!sessionId) {
      setError(null)
      try {
        sessionId = await researchApi.createSession(settings.knowledgeBaseEnabled)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session')
        return
      }
      const title = trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed
      setSessions((prev) => [{ id: sessionId!, title, createdAt: new Date() }, ...prev])
      isFirstMessageRef.current = true
    }

    setError(null)

    const userMessage: ResearchMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    const assistantId = `msg-${Date.now()}-assistant`
    const assistantMessage: ResearchMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    thinkingContentRef.current = ''
    answerContentRef.current = ''
    toolCallsRef.current = []
    citationsRef.current = []
    phaseRef.current = 'waiting'
    streamingMsgIdRef.current = assistantId

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsStreaming(true)
    if (!activeSessionId) setActiveSessionId(sessionId)

    if (isFirstMessageRef.current) {
      const title = trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      )
      isFirstMessageRef.current = false
    }

    const flushStreamContent = () => {
      const content = answerContentRef.current || thinkingContentRef.current
      const msgId = streamingMsgIdRef.current
      if (msgId) {
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

    // SSE data lines cannot contain real newlines, so the backend must
    // escape them as literal "\n". We unescape here to restore formatting.
    const unescapeToken = (t: string) => t.replace(/\\n/g, '\n').replace(/\\t/g, '\t')

    const controller = researchApi.sendMessage(sessionId, trimmed, {
      onThinking: (token) => {
        phaseRef.current = 'thinking'
        thinkingContentRef.current += unescapeToken(token)
        scheduleFlush()
      },
      onToolCall: (data) => {
        phaseRef.current = 'tools'
        try {
          const parsed = JSON.parse(data)
          toolCallsRef.current = [...toolCallsRef.current, { name: parsed.name, args: parsed.args }]
          scheduleFlush()
        } catch { /* ignore malformed */ }
      },
      onToolResult: (data) => {
        if (toolCallsRef.current.length > 0) {
          const updated = [...toolCallsRef.current]
          updated[updated.length - 1] = { ...updated[updated.length - 1], result: data }
          toolCallsRef.current = updated
          scheduleFlush()
        }
      },
      onAnswer: (token) => {
        phaseRef.current = 'answering'
        answerContentRef.current += unescapeToken(token)
        scheduleFlush()
      },
      onCitations: (citations) => {
        citationsRef.current = citations
      },
      onEnd: () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        const finalContent = answerContentRef.current || thinkingContentRef.current
        const finalToolCalls = toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined
        // Use explicit citations event if available, otherwise parse from tool results
        let finalCitations: Citation[] | undefined = citationsRef.current.length > 0 ? [...citationsRef.current] : undefined
        if (!finalCitations && finalToolCalls) {
          const parsed = parseCitationsFromToolResults(finalToolCalls)
          if (parsed.length > 0) finalCitations = parsed
        }
        const msgId = streamingMsgIdRef.current
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? { ...msg, content: finalContent, toolCalls: finalToolCalls, citations: finalCitations, isStreaming: false, streamingPhase: undefined }
              : msg
          )
        )
        setIsStreaming(false)
        streamingMsgIdRef.current = null
        abortControllerRef.current = null
      },
      onError: (errorMsg) => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        const finalContent = answerContentRef.current || thinkingContentRef.current
        const finalToolCalls = toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined
        const msgId = streamingMsgIdRef.current
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? { ...msg, content: finalContent || 'An error occurred.', toolCalls: finalToolCalls, isStreaming: false, streamingPhase: undefined }
              : msg
          )
        )
        setIsStreaming(false)
        setError(errorMsg)
        streamingMsgIdRef.current = null
        abortControllerRef.current = null
      },
    }, { enableKb: settings.knowledgeBaseEnabled, model: settings.model, style: settings.creativity })

    abortControllerRef.current = controller
  }, [activeSessionId, isStreaming, settings.knowledgeBaseEnabled, settings.model, settings.creativity])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    const finalContent = answerContentRef.current || thinkingContentRef.current
    const finalToolCalls = toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined
    const msgId = streamingMsgIdRef.current
    setIsStreaming(false)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? { ...msg, content: finalContent || msg.content, toolCalls: finalToolCalls, isStreaming: false, streamingPhase: undefined }
          : msg.isStreaming ? { ...msg, isStreaming: false, streamingPhase: undefined } : msg
      )
    )
    streamingMsgIdRef.current = null
  }, [])

  const startNewChat = useCallback(() => {
    if (!activeSessionId && messages.length === 0) return
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    setActiveSessionId(null)
    setMessages([])
    setIsStreaming(false)
    setError(null)
    streamingMsgIdRef.current = null
    isFirstMessageRef.current = true
  }, [activeSessionId, messages.length])

  const deleteSession = useCallback(async (id: string) => {
    try {
      await researchApi.deleteSession(id)
    } catch {
      // Continue with local removal even if API fails
    }

    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      if (activeSessionId === id) {
        const nextSession = updated[0] || null
        setActiveSessionId(nextSession?.id ?? null)
        if (!nextSession) setMessages([])
      }
      return updated
    })
  }, [activeSessionId])

  const updateSettings = useCallback((updates: Partial<ResearchSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      persistSettings(next)
      return next
    })
  }, [])

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    isStreaming,
    isLoadingHistory,
    isLoadingSessions,
    error,
    sendMessage,
    cancelStream,
    startNewChat,
    deleteSession,
    settings,
    updateSettings,
  }
}

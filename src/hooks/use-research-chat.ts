import { useState, useEffect, useRef, useCallback } from 'react'
import type { ResearchMessage, ResearchSession, ResearchSettings, StreamingPhase, ToolCall } from '@/types'
import { researchApi } from '@/services/api/research-api'

const SESSIONS_STORAGE_KEY = 'knowlex_chat_sessions'
const SETTINGS_STORAGE_KEY = 'knowlex_chat_settings'
const ACTIVE_SESSION_STORAGE_KEY = 'knowlex_active_chat_session'

const VALID_MODELS = ['openai', 'gemini'] as const
const DEFAULT_MODEL = 'openai'

const DEFAULT_SETTINGS: ResearchSettings = {
  creativity: 'balanced',
  model: DEFAULT_MODEL,
  knowledgeBaseEnabled: true,
}

interface StoredSession {
  id: string
  title: string
  createdAt: string
}

function loadSessions(): ResearchSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (!stored) return []
    const parsed: StoredSession[] = JSON.parse(stored)
    return parsed.map((s) => ({ ...s, createdAt: new Date(s.createdAt) }))
  } catch {
    return []
  }
}

function persistSessions(sessions: ResearchSession[]) {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
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
  const [sessions, setSessions] = useState<ResearchSession[]>(() => loadSessions())
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
      if (!stored) return null
      const allSessions = loadSessions()
      return allSessions.some((s) => s.id === stored) ? stored : null
    } catch {
      return null
    }
  })
  const [messages, setMessages] = useState<ResearchMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<ResearchSettings>(() => loadSettings())

  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstMessageRef = useRef(true)

  // Streaming refs
  const thinkingContentRef = useRef('')
  const answerContentRef = useRef('')
  const toolCallsRef = useRef<ToolCall[]>([])
  const phaseRef = useRef<StreamingPhase>('waiting')
  const streamingMsgIdRef = useRef<string | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // Persist sessions
  useEffect(() => {
    persistSessions(sessions)
  }, [sessions])

  // Persist active session id
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId)
    } else {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
    }
  }, [activeSessionId])

  // Clear on auth expiry
  useEffect(() => {
    const handleExpired = () => {
      setActiveSessionId(null)
      setMessages([])
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
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
      setSessions((prev) => [{ id: sessionId!, title: 'New Chat', createdAt: new Date() }, ...prev])
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

    const controller = researchApi.sendMessage(sessionId, trimmed, {
      onThinking: (token) => {
        phaseRef.current = 'thinking'
        const prev = thinkingContentRef.current
        if (prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n') && !/^[.,;:!?)}\]>]/.test(token)) {
          thinkingContentRef.current += ' '
        }
        thinkingContentRef.current += token
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
        const prev = answerContentRef.current
        if (prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n') && !/^[.,;:!?)}\]>]/.test(token)) {
          answerContentRef.current += ' '
        }
        answerContentRef.current += token
        scheduleFlush()
      },
      onEnd: () => {
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
              ? { ...msg, content: finalContent, toolCalls: finalToolCalls, isStreaming: false, streamingPhase: undefined }
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
    error,
    sendMessage,
    cancelStream,
    startNewChat,
    deleteSession,
    settings,
    updateSettings,
  }
}

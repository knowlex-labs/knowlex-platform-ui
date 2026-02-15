import { useState, useEffect, useRef, useCallback } from 'react'
import type { ResearchMessage, ResearchSession, ResearchSettings, ToolCall } from '@/types'
import { researchApi } from '@/services/api/research-api'

const SESSIONS_STORAGE_KEY = 'knowlex_chat_sessions'
const SETTINGS_STORAGE_KEY = 'knowlex_chat_settings'

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
    // Persist corrected model if it was invalid (e.g. "default")
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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ResearchMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<ResearchSettings>(() => loadSettings())

  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstMessageRef = useRef(true)

  // Streaming token batching — accumulate in ref, flush at 60fps via rAF
  const thinkingContentRef = useRef('')
  const answerContentRef = useRef('')
  const toolCallsRef = useRef<ToolCall[]>([])
  const streamingMsgIdRef = useRef<string | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // Persist sessions whenever they change
  useEffect(() => {
    persistSessions(sessions)
  }, [sessions])

  // Load history when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }

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

        // If there are already messages, it's not the first message anymore
        if (mapped.length > 0) {
          isFirstMessageRef.current = false
        }
      } catch (err) {
        if (cancelled) return
        // Session might be new with no history yet - that's ok
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

  const createSession = useCallback(async () => {
    setError(null)
    try {
      const sessionId = await researchApi.createSession(settings.knowledgeBaseEnabled)
      const newSession: ResearchSession = {
        id: sessionId,
        title: 'New Chat',
        createdAt: new Date(),
      }
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(sessionId)
      setMessages([])
      isFirstMessageRef.current = true
      return sessionId
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create session'
      setError(msg)
      return null
    }
  }, [settings.knowledgeBaseEnabled])

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isStreaming) return

    let sessionId = activeSessionId

    // Auto-create session if none is active
    if (!sessionId) {
      const newId = await createSession()
      if (!newId) return
      sessionId = newId
    }

    setError(null)

    // Add optimistic user message
    const userMessage: ResearchMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    // Add placeholder assistant message
    const assistantId = `msg-${Date.now()}-assistant`
    const assistantMessage: ResearchMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    // Reset streaming refs
    thinkingContentRef.current = ''
    answerContentRef.current = ''
    toolCallsRef.current = []
    streamingMsgIdRef.current = assistantId

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsStreaming(true)

    // Auto-title: set session title from first user message
    if (isFirstMessageRef.current) {
      const title = trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      )
      isFirstMessageRef.current = false
    }

    // Flush accumulated tokens to React state (called via requestAnimationFrame)
    const flushStreamContent = () => {
      // Display answer tokens if we have them, otherwise fall back to thinking tokens
      const content = answerContentRef.current || thinkingContentRef.current
      const msgId = streamingMsgIdRef.current
      if (msgId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? { ...msg, content, toolCalls: toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined }
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
        thinkingContentRef.current += token
        scheduleFlush()
      },
      onToolCall: (data) => {
        try {
          const parsed = JSON.parse(data)
          toolCallsRef.current = [...toolCallsRef.current, { name: parsed.name, args: parsed.args }]
          scheduleFlush()
        } catch {
          // Ignore malformed tool_call data
        }
      },
      onToolResult: (data) => {
        // Attach result to the last tool call
        if (toolCallsRef.current.length > 0) {
          const updated = [...toolCallsRef.current]
          updated[updated.length - 1] = { ...updated[updated.length - 1], result: data }
          toolCallsRef.current = updated
          scheduleFlush()
        }
      },
      onAnswer: (token) => {
        answerContentRef.current += token
        scheduleFlush()
      },
      onEnd: () => {
        // Cancel any pending frame and do a final flush
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
              ? { ...msg, content: finalContent, toolCalls: finalToolCalls, isStreaming: false }
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
              ? { ...msg, content: finalContent || 'An error occurred.', toolCalls: finalToolCalls, isStreaming: false }
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
  }, [activeSessionId, isStreaming, createSession, settings.knowledgeBaseEnabled, settings.model, settings.creativity])

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
          ? { ...msg, content: finalContent || msg.content, toolCalls: finalToolCalls, isStreaming: false }
          : msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    )
    streamingMsgIdRef.current = null
  }, [])

  const deleteSession = useCallback(async (id: string) => {
    try {
      await researchApi.deleteSession(id)
    } catch {
      // Continue with local removal even if API fails
    }

    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      // If we're deleting the active session, switch to the next one
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
    createSession,
    deleteSession,
    settings,
    updateSettings,
  }
}

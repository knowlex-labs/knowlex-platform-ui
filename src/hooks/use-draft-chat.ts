import { useState, useEffect, useRef, useCallback } from 'react'
import type { DraftChatMessage, DraftChatSettings, DraftChatSession } from '@/types'
import { draftChatApi } from '@/services/api/draft-chat-api'

type ToolCall = DraftChatMessage['toolCalls'] extends Array<infer T> | undefined ? T : never

const DEFAULT_SETTINGS: DraftChatSettings = {
  tone: 'formal',
  style: 'balanced',
  model: 'gemini_flash',
}

export function useDraftChat(caseId: string) {
  const [messages, setMessages] = useState<DraftChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [sessions, setSessions] = useState<DraftChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [settings, setSettings] = useState<DraftChatSettings>(DEFAULT_SETTINGS)

  const abortControllerRef = useRef<AbortController | null>(null)
  const answerContentRef = useRef('')
  const toolCallsRef = useRef<ToolCall[]>([])
  const phaseRef = useRef<DraftChatMessage['streamingPhase']>('waiting')
  const streamingMsgIdRef = useRef<string | null>(null)
  const rafIdRef = useRef<number | null>(null)

  const loadHistory = useCallback(async (sessionId: string) => {
    setIsLoadingHistory(true)
    try {
      const history = await draftChatApi.getHistory(caseId, sessionId)
      const mapped: DraftChatMessage[] = history.map((msg, i) => ({
        id: `hist-${sessionId}-${i}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(),
        toolCalls: msg.toolCalls,
      }))
      setMessages(mapped)
    } catch {
      setMessages([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [caseId])

  // On mount / caseId change: list sessions, select most recent or create new
  useEffect(() => {
    if (!caseId) return
    let cancelled = false

    const init = async () => {
      setIsLoadingSessions(true)
      try {
        const sessionList = await draftChatApi.listSessions(caseId)
        if (cancelled) return

        const mapped: DraftChatSession[] = sessionList.map((s) => ({
          id: s.id,
          title: s.title,
          createdAt: new Date(s.createdAt),
        }))

        if (mapped.length > 0) {
          setSessions(mapped)
          const mostRecent = mapped[0]
          setActiveSessionId(mostRecent.id)
          await loadHistory(mostRecent.id)
        } else {
          // No sessions — create one
          const created = await draftChatApi.createSession(caseId)
          if (cancelled) return
          const newSession: DraftChatSession = {
            id: created.id,
            title: created.title,
            createdAt: new Date(created.createdAt),
          }
          setSessions([newSession])
          setActiveSessionId(newSession.id)
          setMessages([])
        }
      } catch {
        // Failed to load sessions
      } finally {
        if (!cancelled) setIsLoadingSessions(false)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [caseId, loadHistory])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  const selectSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === activeSessionId) return
      setActiveSessionId(sessionId)
      await loadHistory(sessionId)
    },
    [activeSessionId, loadHistory]
  )

  const startNewChat = useCallback(async () => {
    try {
      const created = await draftChatApi.createSession(caseId)
      const newSession: DraftChatSession = {
        id: created.id,
        title: created.title,
        createdAt: new Date(created.createdAt),
      }
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      setMessages([])
    } catch {
      // Failed to create session
    }
  }, [caseId])

  const sendMessage = useCallback(
    async (message: string, fileIds: string[]) => {
      const trimmed = message.trim()
      if (!trimmed || isStreaming || !activeSessionId) return

      const userMsg: DraftChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      const assistantId = `msg-${Date.now()}-assistant`
      const assistantMsg: DraftChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        streamingPhase: 'waiting',
      }

      answerContentRef.current = ''
      toolCallsRef.current = []
      phaseRef.current = 'waiting'
      streamingMsgIdRef.current = assistantId

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      const flushStreamContent = () => {
        const msgId = streamingMsgIdRef.current
        if (msgId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === msgId
                ? {
                    ...msg,
                    content: answerContentRef.current,
                    streamingPhase: phaseRef.current,
                    toolCalls:
                      toolCallsRef.current.length > 0
                        ? [...toolCallsRef.current]
                        : undefined,
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

      const controller = draftChatApi.sendMessage(
        caseId,
        activeSessionId,
        {
          message: trimmed,
          tone: settings.tone,
          style: settings.style,
          model: settings.model,
          file_ids: fileIds,
        },
        {
          onAnswer: (token) => {
            phaseRef.current = 'answering'
            answerContentRef.current += unescapeToken(token)
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
            if (toolCallsRef.current.length > 0) {
              const updated = [...toolCallsRef.current]
              updated[updated.length - 1] = { ...updated[updated.length - 1], result: data }
              toolCallsRef.current = updated
              scheduleFlush()
            }
          },
          onEnd: () => {
            if (rafIdRef.current !== null) {
              cancelAnimationFrame(rafIdRef.current)
              rafIdRef.current = null
            }
            const finalContent = answerContentRef.current
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
            streamingMsgIdRef.current = null
            abortControllerRef.current = null
          },
          onError: (errorMsg) => {
            if (rafIdRef.current !== null) {
              cancelAnimationFrame(rafIdRef.current)
              rafIdRef.current = null
            }
            const finalContent = answerContentRef.current
            const finalToolCalls =
              toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined
            const msgId = streamingMsgIdRef.current
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId
                  ? {
                      ...msg,
                      content: finalContent || `Error: ${errorMsg}`,
                      toolCalls: finalToolCalls,
                      isStreaming: false,
                      streamingPhase: undefined,
                    }
                  : msg
              )
            )
            setIsStreaming(false)
            streamingMsgIdRef.current = null
            abortControllerRef.current = null
          },
        }
      )

      abortControllerRef.current = controller
    },
    [caseId, activeSessionId, isStreaming, settings]
  )

  const clearChat = useCallback(async () => {
    if (!activeSessionId) return
    try {
      await draftChatApi.clearMessages(caseId, activeSessionId)
    } catch {
      // Continue even if API fails
    }
    setMessages([])
  }, [caseId, activeSessionId])

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await draftChatApi.deleteSession(caseId, sessionId)
      } catch {
        // Continue even if API fails
      }

      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== sessionId)

        if (sessionId === activeSessionId) {
          if (remaining.length > 0) {
            const next = remaining[0]
            setActiveSessionId(next.id)
            loadHistory(next.id)
          } else {
            // No sessions left — create a new one
            setActiveSessionId(null)
            setMessages([])
            draftChatApi.createSession(caseId).then((created) => {
              const newSession: DraftChatSession = {
                id: created.id,
                title: created.title,
                createdAt: new Date(created.createdAt),
              }
              setSessions([newSession])
              setActiveSessionId(newSession.id)
            }).catch(() => {})
          }
        }

        return remaining
      })
    },
    [activeSessionId, caseId, loadHistory]
  )

  const updateSettings = useCallback(
    (updates: Partial<DraftChatSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates }
        if (activeSessionId) {
          draftChatApi.updateDefaults(caseId, activeSessionId, next.tone, next.style).catch(() => {})
        }
        return next
      })
    },
    [caseId, activeSessionId]
  )

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      try {
        await draftChatApi.updateDefaults(caseId, sessionId, trimmed, settings.style)
        setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title: trimmed } : s))
      } catch {
        // ignore
      }
    },
    [caseId, settings.style]
  )

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    sessions,
    activeSessionId,
    isLoadingSessions,
    settings,
    sendMessage,
    clearChat,
    deleteSession,
    selectSession,
    startNewChat,
    updateSettings,
    renameSession,
  }
}

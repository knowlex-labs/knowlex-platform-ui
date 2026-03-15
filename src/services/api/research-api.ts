import { config } from '@/config/env'
import { apiClient } from './api-client'
import type { Citation } from '@/types'

const API_BASE_URL = config.apiBaseUrl

interface CreateSessionResponse {
  status: string
  message: string
  data: {
    session_id: string
  }
}

interface HistoryToolCall {
  name: string
  args: Record<string, unknown>
  result: string
}

interface ChatHistoryResponse {
  status: string
  message: string
  data: {
    session_id: string
    messages: Array<{
      role: 'human' | 'ai'
      content: string
      toolCalls: HistoryToolCall[] | null
    }>
  }
}

interface ListSessionsResponse {
  status: string
  message: string
  data: Array<{ session_id: string }>
}

interface DeleteSessionResponse {
  status: string
  message: string
  data: {
    status: string
  }
}

export interface SSECallbacks {
  onThinking: (token: string) => void
  onToolCall: (data: string) => void
  onToolResult: (data: string) => void
  onAnswer: (token: string) => void
  onCitations?: (citations: Citation[]) => void
  onEnd: () => void
  onError: (error: string) => void
}

export const researchApi = {
  getSessions: async (): Promise<string[]> => {
    const response = await apiClient.get<ListSessionsResponse>('/api/v1/chat/sessions')
    return (response.data ?? []).map((s) => s.session_id)
  },

  createSession: async (enableKb = true): Promise<string> => {
    const response = await apiClient.post<CreateSessionResponse>('/api/v1/chat/sessions', { enable_kb: enableKb })
    return response.data.session_id
  },

  getHistory: async (sessionId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string; toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: string }> }>> => {
    const response = await apiClient.get<ChatHistoryResponse>(`/api/v1/chat/sessions/${sessionId}/history`)
    return (response.data?.messages ?? []).map((msg) => ({
      role: msg.role === 'human' ? 'user' as const : 'assistant' as const,
      content: msg.content,
      toolCalls: msg.toolCalls ?? undefined,
    }))
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete<DeleteSessionResponse>(`/api/v1/chat/sessions/${sessionId}`)
  },

  sendMessage: (sessionId: string, message: string, callbacks: SSECallbacks, options?: { enableKb?: boolean; model?: string; style?: string }): AbortController => {
    const controller = new AbortController()
    const token = localStorage.getItem('auth_token')
    const userId = localStorage.getItem('auth_user_id')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (userId) headers['x-user-id'] = userId

    fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        enable_kb: options?.enableKb === true,
        model:
          options?.model && ['openai', 'gemini'].includes(options.model)
            ? options.model
            : 'openai',
        style: options?.style || 'balanced',
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:session-expired'))
          }
          const errorData = await response.json().catch(() => null)
          const errorMsg = errorData?.message || `HTTP error ${response.status}`
          callbacks.onError(errorMsg)
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          callbacks.onError('No response body')
          return
        }

        const decoder = new TextDecoder()
        let currentEvent: string | null = null
        let currentData: string | null = null
        let buffer = ''
        let pendingCitations: Citation[] | null = null

        const dispatchEvent = () => {
          if (currentEvent && currentData !== null) {
            if (currentEvent === 'end') {
              // Buffer end — fire after citations if any
              return 'end'
            }
            if (currentEvent === 'error') {
              callbacks.onError(currentData.trim())
              return 'error'
            }
            if (currentEvent === 'citations') {
              try {
                pendingCitations = JSON.parse(currentData) as Citation[]
              } catch { /* ignore malformed */ }
            } else if (currentEvent === 'thinking') {
              callbacks.onThinking(currentData)
            } else if (currentEvent === 'tool_call') {
              callbacks.onToolCall(currentData)
            } else if (currentEvent === 'tool_result') {
              callbacks.onToolResult(currentData)
            } else if (currentEvent === 'answer') {
              callbacks.onAnswer(currentData)
            }
          }
          currentEvent = null
          currentData = null
          return null
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const allLines = buffer.split('\n')
          // Keep the last part in buffer (incomplete line if no trailing \n)
          buffer = allLines.pop() ?? ''

          for (const rawLine of allLines) {
            const line = rawLine.replace(/\r$/, '')

            if (line === '') {
              // Blank line = dispatch buffered event
              const result = dispatchEvent()
              if (result === 'error') return
              continue
            }

            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim()
            } else if (line.startsWith('data:')) {
              // Keep leading space — backend sends LLM tokens where the space is
              // part of the data (e.g. " The" becomes "data: The")
              const value = line.substring(5)
              // SSE spec: multiple data lines in one event are joined with newlines
              if (currentData === null) {
                currentData = value
              } else {
                currentData += '\n' + value
              }
            }
          }
        }

        // Dispatch any remaining buffered event (stream may end without trailing blank line)
        dispatchEvent()

        // Fire citations before end so hook can finalize message with them
        if (pendingCitations && callbacks.onCitations) {
          callbacks.onCitations(pendingCitations)
        }
        callbacks.onEnd()
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        callbacks.onError(err.message || 'Network error')
      })

    return controller
  },
}

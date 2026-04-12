import { getAdapters } from './runtime'
import { getAuthHeaders } from './auth-headers'
import { apiClient } from './api-client'

function getBaseUrl(): string {
  return getAdapters().env.apiBaseUrl
}

function chatBase(caseId: string) {
  return `/api/v1/cases/${caseId}/chat/sessions`
}

interface CreateSessionResponse {
  success: boolean
  message: string
  data: {
    session_id: string
    title: string
    created_at: string
  }
}

interface GetSessionResponse {
  success: boolean
  message: string
  data: {
    id: string
    caseId: string
    title: string
    style: string
    createdAt: string
  }
}

interface ListSessionsResponse {
  success: boolean
  message: string
  data: Array<{
    session_id: string
    title: string
    created_at: string
  }>
}

interface HistoryToolCall {
  name: string
  args: Record<string, unknown>
  result: string
}

interface ChatHistoryResponse {
  success: boolean
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

export interface DraftChatSSECallbacks {
  onAnswer: (token: string) => void
  onToolCall: (data: string) => void
  onToolResult: (data: string) => void
  onDocumentCitations?: (data: string) => void
  onEnd: () => void
  onError: (error: string) => void
}

export const draftChatApi = {
  createSession: async (
    caseId: string
  ): Promise<{ id: string; title: string; createdAt: string }> => {
    const response = await apiClient.post<CreateSessionResponse>(
      chatBase(caseId),
      {}
    )
    return {
      id: response.data.session_id,
      title: response.data.title,
      createdAt: response.data.created_at,
    }
  },

  listSessions: async (
    caseId: string
  ): Promise<Array<{ id: string; title: string; createdAt: string }>> => {
    const response = await apiClient.get<ListSessionsResponse>(
      chatBase(caseId)
    )
    return (response.data ?? []).map((s) => ({
      id: s.session_id,
      title: s.title,
      createdAt: s.created_at,
    }))
  },

  getSession: async (
    caseId: string,
    sessionId: string
  ): Promise<{ id: string; caseId: string; title: string; style: string; createdAt: string }> => {
    const response = await apiClient.get<GetSessionResponse>(
      `${chatBase(caseId)}/${sessionId}`
    )
    return {
      id: response.data.id,
      caseId: response.data.caseId,
      title: response.data.title,
      style: response.data.style,
      createdAt: response.data.createdAt,
    }
  },

  getHistory: async (
    caseId: string,
    sessionId: string
  ): Promise<
    Array<{
      role: 'user' | 'assistant'
      content: string
      toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: string }>
    }>
  > => {
    const response = await apiClient.get<ChatHistoryResponse>(
      `${chatBase(caseId)}/${sessionId}/history`
    )
    return (response.data?.messages ?? []).map((msg) => ({
      role: msg.role === 'human' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
      toolCalls: msg.toolCalls ?? undefined,
    }))
  },

  clearMessages: async (caseId: string, sessionId: string): Promise<void> => {
    await apiClient.delete(`${chatBase(caseId)}/${sessionId}/history`)
  },

  deleteSession: async (caseId: string, sessionId: string): Promise<void> => {
    await apiClient.delete(`${chatBase(caseId)}/${sessionId}`)
  },

  updateDefaults: async (
    caseId: string,
    sessionId: string,
    title: string,
    style: string
  ): Promise<void> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...getAuthHeaders() }
    await fetch(`${getBaseUrl()}${chatBase(caseId)}/${sessionId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title, style }),
    })
  },

  sendMessage: (
    caseId: string,
    sessionId: string,
    payload: { message: string; tone: string; style: string; file_ids: string[]; model: string },
    callbacks: DraftChatSSECallbacks
  ): AbortController => {
    const controller = new AbortController()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...getAuthHeaders(),
    }

    fetch(`${getBaseUrl()}${chatBase(caseId)}/${sessionId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            getAdapters().eventBus.dispatch('auth:session-expired')
          }
          const errorData: { message?: string } | null = await response.json().catch(() => null)
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
        const dispatchEvent = () => {
          if (currentEvent && currentData !== null) {
            if (currentEvent === 'end') {
              // Don't call onEnd yet — document_citations may follow after end
              currentEvent = null
              currentData = null
              return 'end'
            }
            if (currentEvent === 'error') {
              callbacks.onError(currentData.trim())
              currentEvent = null
              currentData = null
              return 'error'
            }
            if (currentEvent === 'answer') {
              callbacks.onAnswer(currentData)
            } else if (currentEvent === 'tool_call') {
              callbacks.onToolCall(currentData)
            } else if (currentEvent === 'tool_result') {
              callbacks.onToolResult(currentData)
            } else if (currentEvent === 'document_citations') {
              callbacks.onDocumentCitations?.(currentData)
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
          buffer = allLines.pop() ?? ''

          for (const rawLine of allLines) {
            const line = rawLine.replace(/\r$/, '')

            if (line === '') {
              const result = dispatchEvent()
              if (result === 'error') return
              // Don't return on 'end' — keep reading for document_citations
              continue
            }

            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim()
            } else if (line.startsWith('data:')) {
              const dataValue = line.substring(5)
              if (currentData === null) {
                currentData = dataValue
              } else {
                currentData += '\n' + dataValue
              }
            }
          }
        }

        // Process any remaining buffered event
        dispatchEvent()
        // Always call onEnd once stream is fully consumed
        callbacks.onEnd()
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        callbacks.onError(err.message || 'Network error')
      })

    return controller
  },
}

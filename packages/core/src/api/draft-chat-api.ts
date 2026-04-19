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
    name: string
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
    name: string
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
  onSessionTitle?: (title: string) => void
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
      title: response.data.name,
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
      title: s.name,
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...getAuthHeaders(),
    }

    // Dispatch SSE events to the right callback. Returns 'error' to stop early.
    const handleEvent = (event: string, data: string): 'error' | null => {
      if (event === 'end') {
        // Don't call onEnd yet — document_citations may follow after end.
        return null
      }
      if (event === 'error') {
        callbacks.onError(data.trim())
        return 'error'
      }
      if (event === 'answer') callbacks.onAnswer(data)
      else if (event === 'tool_call') callbacks.onToolCall(data)
      else if (event === 'tool_result') callbacks.onToolResult(data)
      else if (event === 'document_citations') callbacks.onDocumentCitations?.(data)
      else if (event === 'session_title') callbacks.onSessionTitle?.(data.trim())
      return null
    }

    let stopped = false
    return getAdapters().sse.stream(
      `${getBaseUrl()}${chatBase(caseId)}/${sessionId}/messages`,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      {
        onEvent: (event, data) => {
          if (stopped) return
          if (handleEvent(event, data) === 'error') stopped = true
        },
        onError: (msg) => {
          if (stopped) return
          stopped = true
          callbacks.onError(msg)
        },
        onEnd: () => {
          if (stopped) return
          stopped = true
          callbacks.onEnd()
        },
        onUnauthorized: () => {
          getAdapters().eventBus.dispatch('auth:session-expired')
        },
      }
    )
  },
}

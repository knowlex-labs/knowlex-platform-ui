import { config } from '@/config/env'
import { apiClient } from './api-client'

const API_BASE_URL = config.apiBaseUrl

interface CreateSessionResponse {
  status: string
  message: string
  data: {
    session_id: string
  }
}

interface ChatHistoryResponse {
  status: string
  message: string
  data: {
    session_id: string
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
  }
}

interface DeleteSessionResponse {
  status: string
  message: string
  data: {
    status: string
  }
}

export interface SSECallbacks {
  onToken: (token: string) => void
  onEnd: () => void
  onError: (error: string) => void
}

export const researchApi = {
  createSession: async (enableKb = true): Promise<string> => {
    const response = await apiClient.post<CreateSessionResponse>('/api/v1/chat/sessions', { enable_kb: enableKb })
    return response.data.session_id
  },

  getHistory: async (sessionId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> => {
    const response = await apiClient.get<ChatHistoryResponse>(`/api/v1/chat/sessions/${sessionId}/history`)
    return response.data.messages
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
      body: JSON.stringify({ message, enable_kb: options?.enableKb === true, model: options?.model || 'openai', style: options?.style || 'balanced' }),
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

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim()
            } else if (line.startsWith('data:')) {
              // Keep everything after "data:" — the space is part of the token content
              const raw = line.substring(5)

              if (currentEvent === 'end') {
                callbacks.onEnd()
                return
              }

              if (currentEvent === 'error') {
                callbacks.onError(raw.trim())
                return
              }

              if (currentEvent === 'token') {
                callbacks.onToken(raw)
              }
            }
          }
        }

        // If we exit the loop without an end event, still signal completion
        callbacks.onEnd()
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        callbacks.onError(err.message || 'Network error')
      })

    return controller
  },
}

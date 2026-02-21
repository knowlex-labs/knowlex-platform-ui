import { config } from '@/config/env'
import type { AgentMode } from '@/types'

const API_BASE_URL = config.apiBaseUrl

export interface AgentSSECallbacks {
  onThinking: (token: string) => void
  onToolCall: (data: string) => void
  onToolResult: (data: string) => void
  onAnswer: (token: string) => void
  onEnd: () => void
  onError: (error: string) => void
}

export interface AgentRequestPayload {
  mode: AgentMode
  message: string
  source_ids: string[]
  active_draft_content?: string
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export const agentApi = {
  sendMessage: (
    caseId: string,
    payload: AgentRequestPayload,
    callbacks: AgentSSECallbacks
  ): AbortController => {
    const controller = new AbortController()
    const token = localStorage.getItem('auth_token')
    const userId = localStorage.getItem('auth_user_id')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (userId) headers['x-user-id'] = userId

    fetch(`${API_BASE_URL}/api/v1/cases/${caseId}/agent/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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

        const dispatchEvent = () => {
          if (currentEvent && currentData !== null) {
            if (currentEvent === 'end') {
              callbacks.onEnd()
              return 'end'
            }
            if (currentEvent === 'error') {
              callbacks.onError(currentData.trim())
              return 'error'
            }
            if (currentEvent === 'thinking') {
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
          buffer = allLines.pop() ?? ''

          for (const rawLine of allLines) {
            const line = rawLine.replace(/\r$/, '')

            if (line === '') {
              const result = dispatchEvent()
              if (result === 'end' || result === 'error') return
              continue
            }

            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim()
            } else if (line.startsWith('data:')) {
              const value = line.substring(5)
              if (currentData === null) {
                currentData = value
              } else {
                currentData += '\n' + value
              }
            }
          }
        }

        const result = dispatchEvent()
        if (result !== 'end') {
          callbacks.onEnd()
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        callbacks.onError(err.message || 'Network error')
      })

    return controller
  },
}

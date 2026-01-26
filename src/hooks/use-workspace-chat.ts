import { useState, useCallback } from 'react'
import { workspaceApi } from '@/services/api/workspace-api'
import type { WorkspaceMessage } from '@/types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

interface UseWorkspaceChatResult {
  messages: WorkspaceMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (query: string, sourceIds: string[]) => Promise<void>
  executeTool: (toolId: string, sourceIds: string[]) => Promise<void>
  clearChat: () => void
}

export function useWorkspaceChat(caseId: string | null): UseWorkspaceChatResult {
  const [messages, setMessages] = useState<WorkspaceMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (query: string, sourceIds: string[]) => {
      if (!caseId || !query.trim()) return

      setIsLoading(true)
      setError(null)

      // Add user message
      const userMessage: WorkspaceMessage = {
        id: generateId(),
        role: 'user',
        content: query,
        timestamp: new Date(),
        sourceIds,
      }
      setMessages((prev) => [...prev, userMessage])

      try {
        const response = await workspaceApi.sendChatQuery(caseId, {
          query,
          sourceIds,
        })

        // Add assistant response
        const assistantMessage: WorkspaceMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message'
        setError(message)

        // Add error message
        const errorMessage: WorkspaceMessage = {
          id: generateId(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${message}. Please try again.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [caseId]
  )

  const executeTool = useCallback(
    async (toolId: string, sourceIds: string[]) => {
      if (!caseId) return

      setIsLoading(true)
      setError(null)

      // Add a system message indicating tool execution
      const toolMessage: WorkspaceMessage = {
        id: generateId(),
        role: 'user',
        content: `[Executing tool: ${toolId}]`,
        timestamp: new Date(),
        sourceIds,
      }
      setMessages((prev) => [...prev, toolMessage])

      try {
        const response = await workspaceApi.executeLegalTool(caseId, toolId, {
          sourceIds,
        })

        // Add tool result
        const resultMessage: WorkspaceMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.result,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, resultMessage])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to execute tool'
        setError(message)

        const errorMessage: WorkspaceMessage = {
          id: generateId(),
          role: 'assistant',
          content: `Sorry, I couldn't execute the tool: ${message}. Please try again.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [caseId]
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    executeTool,
    clearChat,
  }
}

import { useState, useCallback } from 'react'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import type { WorkspaceMessage, ChatResponse } from '@knowlex/core/types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Helper to format response with sources
function formatResponseWithSources(response: ChatResponse): string {
  let content = response.content

  if (response.sources?.length > 0) {
    content += '\n\n**Sources:**\n'
    response.sources.forEach((src) => {
      content += `- ${src.fileName} (p.${src.page}): "${src.textSnippet}"\n`
    })
  }

  return content
}

interface UseWorkspaceChatResult {
  messages: WorkspaceMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (query: string, sourceIds: string[]) => Promise<void>
  executeTool: (toolId: string, sourceIds: string[]) => Promise<void>
  clearChat: () => void
}

export function useWorkspaceChat(_caseId: string | null): UseWorkspaceChatResult {
  const [messages, setMessages] = useState<WorkspaceMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (query: string, sourceIds: string[]) => {
      if (!query.trim()) return

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
        const response = await workspaceApi.sendChatQuery(query, sourceIds)

        // Add assistant response with formatted sources
        const assistantMessage: WorkspaceMessage = {
          id: generateId(),
          role: 'assistant',
          content: formatResponseWithSources(response),
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
    []
  )

  const executeTool = useCallback(
    async (toolId: string, sourceIds: string[]) => {
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
        let response: ChatResponse

        if (toolId === 'summarize') {
          // Summarize tool uses /chat/summary endpoint
          response = await workspaceApi.sendSummaryQuery(
            'Summarize the key points of these documents',
            sourceIds
          )
        } else {
          // Other tools use /chat/query with specific prompts
          const toolPrompts: Record<string, string> = {
            'create-report': 'Generate a legal analysis report based on these documents',
            'extract-facts': 'List the key facts from these documents',
            'find-precedents': 'Find relevant case precedents mentioned in these documents',
            'draft-response': 'Draft a legal response based on these documents',
          }
          const prompt = toolPrompts[toolId] || `Execute ${toolId} on these documents`
          response = await workspaceApi.sendChatQuery(prompt, sourceIds)
        }

        // Add tool result with formatted sources
        const resultMessage: WorkspaceMessage = {
          id: generateId(),
          role: 'assistant',
          content: formatResponseWithSources(response),
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
    []
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

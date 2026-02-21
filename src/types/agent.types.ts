export type AgentMode = 'ask' | 'edit'

export type AgentStreamingPhase = 'waiting' | 'thinking' | 'tools' | 'answering'

export interface AgentToolCall {
  name: string
  args: Record<string, unknown>
  result?: Record<string, unknown>
}

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  mode: AgentMode
  isStreaming?: boolean
  streamingPhase?: AgentStreamingPhase
  toolCalls?: AgentToolCall[]
}

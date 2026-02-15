export interface ToolCall {
  name: string
  args: Record<string, unknown>
  result?: string
}

export type StreamingPhase = 'waiting' | 'thinking' | 'tools' | 'answering'

export interface ResearchMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  streamingPhase?: StreamingPhase
  toolCalls?: ToolCall[]
}

export interface ResearchSession {
  id: string
  title: string
  createdAt: Date
}

export interface ResearchSettings {
  creativity: 'precise' | 'balanced' | 'detailed'
  model: string
  knowledgeBaseEnabled: boolean
}

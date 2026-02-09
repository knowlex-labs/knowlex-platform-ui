export interface ResearchMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface ResearchSession {
  id: string
  title: string
  createdAt: Date
}

export interface ResearchSettings {
  creativity: 'precise' | 'balanced' | 'creative'
  model: string
  knowledgeBaseEnabled: boolean
}

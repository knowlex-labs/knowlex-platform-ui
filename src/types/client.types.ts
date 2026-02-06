import type { Case, CaseStatus } from './case.types'

export type { CaseStatus }

export type ClientType = 'individual' | 'company'

export type ActivityType =
  | 'filing'
  | 'hearing'
  | 'document'
  | 'communication'
  | 'research'
  | 'payment'
  | 'note'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  date: Date
  metadata?: Record<string, string>
}

export interface AIResearchItem {
  id: string
  title: string
  summary: string
  relevance: 'high' | 'medium' | 'low'
  source: string
  createdAt: Date
  tags: string[]
}

// Simplified Client interface matching backend
export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  clientType: ClientType
  caseId: string | null
  createdAt: Date
  updatedAt: Date
}

// Composite type for UI display (client with case info joined)
export interface ClientWithCase extends Client {
  case: Case | null
}

// Full client view with activities and research (for detail page)
export interface ClientDetailView extends ClientWithCase {
  activities: Activity[]
  aiResearch: AIResearchItem[]
}

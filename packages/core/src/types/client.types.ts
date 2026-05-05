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

// Latest activity recorded against a case (most recently updated document)
export interface CaseLatestActivity {
  type: string | null
  label: string | null
  at: Date | null
}

// Compact summary of a case linked to a client
export interface ClientCaseSummary {
  caseId: string
  caseNumber: string | null
  caseTitle: string | null
  caseType: string | null
  caseStatus: CaseStatus
  courtName: string | null
  nextHearingDate: Date | null
  latestActivity: CaseLatestActivity | null
}

// Simplified Client interface matching backend
export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  clientType: ClientType
  caseIds: string[]
  caseSummaries: ClientCaseSummary[]
  createdAt: Date
  updatedAt: Date
}

// Composite type for UI display (client with case info joined)
export interface ClientWithCase extends Client {
  cases: Case[]
}

// Full client view with activities (for detail page)
export interface ClientDetailView extends ClientWithCase {
  activities: Activity[]
}

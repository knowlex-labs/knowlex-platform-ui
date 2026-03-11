export interface AiProductivityStats {
  timeSavedHours: number
  draftsGenerated: number
  docsProcessed: number
  successRate: number
}

export interface ChartDataPoint {
  label: string
  cases: number
  drafts: number
}

// New chart format from API
export interface ChartDataPointApi {
  period: string
  caseCount: number
  draftCount: number
}

export interface ChartDataApi {
  weekly: ChartDataPointApi[]
  monthly: ChartDataPointApi[]
}

export type ChartPeriod = 'week' | 'month'

export interface ActivityFeedItem {
  id: string
  type: 'case_created' | 'draft_generated' | 'client_added' | 'document_uploaded' | 'hearing_scheduled'
  title: string
  description: string
  timestamp: string
}

// API response types for dashboard endpoints
export interface DashboardSummary {
  totalCases: number
  totalDrafts: number
  totalClients: number
  hrsSaved: number
  recentCases: RecentCase[]
  recentClients: RecentClient[]
}

export interface RecentCase {
  id: string
  title: string
  status: string
  createdAt: string
  clientName?: string
}

export interface RecentClient {
  id: string
  name: string
  email?: string
  createdAt: string
}

export interface RecentActivityItem {
  type: 'DRAFT_GENERATED' | 'JUDGMENT_ADDED' | 'DOCUMENT_UPLOADED' | 'CASE_CREATED'
  caseTitle: string
  description: string
  timestamp: string
}

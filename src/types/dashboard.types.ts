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

export type ChartPeriod = 'week' | 'month'

export interface ActivityFeedItem {
  id: string
  type: 'case_created' | 'draft_generated' | 'client_added' | 'document_uploaded' | 'hearing_scheduled'
  title: string
  description: string
  timestamp: string
}

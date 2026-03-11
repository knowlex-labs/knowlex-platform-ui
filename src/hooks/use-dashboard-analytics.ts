import { useState, useMemo } from 'react'
import type {
  AiProductivityStats,
  ChartDataPoint,
  ChartPeriod,
  ActivityFeedItem,
} from '@/types/dashboard.types'

const MOCK_AI_STATS: AiProductivityStats = {
  timeSavedHours: 42,
  draftsGenerated: 18,
  docsProcessed: 67,
  successRate: 94,
}

const MOCK_WEEKLY_DATA: ChartDataPoint[] = [
  { label: 'Mon', cases: 3, drafts: 5 },
  { label: 'Tue', cases: 2, drafts: 4 },
  { label: 'Wed', cases: 5, drafts: 7 },
  { label: 'Thu', cases: 1, drafts: 3 },
  { label: 'Fri', cases: 4, drafts: 6 },
  { label: 'Sat', cases: 0, drafts: 1 },
  { label: 'Sun', cases: 1, drafts: 2 },
]

const MOCK_MONTHLY_DATA: ChartDataPoint[] = [
  { label: 'Week 1', cases: 12, drafts: 18 },
  { label: 'Week 2', cases: 9, drafts: 15 },
  { label: 'Week 3', cases: 15, drafts: 22 },
  { label: 'Week 4', cases: 11, drafts: 19 },
]

const MOCK_ACTIVITY: ActivityFeedItem[] = [
  {
    id: '1',
    type: 'draft_generated',
    title: 'Draft generated',
    description: 'AI draft completed for "Smith v. Johnson"',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: '2',
    type: 'case_created',
    title: 'New case filed',
    description: 'Case "Doe v. State" was created',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    type: 'document_uploaded',
    title: 'Document uploaded',
    description: '3 documents indexed for "Patel v. Corp"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    type: 'client_added',
    title: 'Client added',
    description: 'New client "Acme Industries" registered',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: '5',
    type: 'hearing_scheduled',
    title: 'Hearing scheduled',
    description: 'Hearing set for "Rivera v. City" on Mar 18',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

interface UseDashboardAnalyticsResult {
  aiStats: AiProductivityStats
  chartData: ChartDataPoint[]
  chartPeriod: ChartPeriod
  setChartPeriod: (period: ChartPeriod) => void
  activityFeed: ActivityFeedItem[]
  isLoading: boolean
}

export function useDashboardAnalytics(): UseDashboardAnalyticsResult {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('week')

  const chartData = useMemo(
    () => (chartPeriod === 'week' ? MOCK_WEEKLY_DATA : MOCK_MONTHLY_DATA),
    [chartPeriod]
  )

  return {
    aiStats: MOCK_AI_STATS,
    chartData,
    chartPeriod,
    setChartPeriod,
    activityFeed: MOCK_ACTIVITY,
    isLoading: false,
  }
}

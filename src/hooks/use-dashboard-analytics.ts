import { useState, useEffect, useMemo } from 'react'
import { dashboardApi } from '@/services/api/dashboard-api'
import type { ChartDataPoint as ChartDataPointApi } from '@/services/api/dashboard-api'
import type {
  AiProductivityStats,
  ChartDataPoint,
  ChartPeriod,
  ActivityFeedItem,
} from '@/types/dashboard.types'

// Map API activity type to frontend type
function mapActivityType(apiType: string): ActivityFeedItem['type'] {
  const typeMap: Record<string, ActivityFeedItem['type']> = {
    DRAFT_GENERATED: 'draft_generated',
    CASE_CREATED: 'case_created',
    DOCUMENT_UPLOADED: 'document_uploaded',
    JUDGMENT_ADDED: 'case_created',
  }
  return typeMap[apiType] || 'case_created'
}

// Map API chart data to frontend format
function mapChartData(apiData: ChartDataPointApi[]): ChartDataPoint[] {
  return apiData.map((point) => ({
    label: point.period,
    cases: point.caseCount,
    drafts: point.draftCount,
  }))
}

interface UseDashboardAnalyticsResult {
  aiStats: AiProductivityStats
  chartData: ChartDataPoint[]
  chartPeriod: ChartPeriod
  setChartPeriod: (period: ChartPeriod) => void
  activityFeed: ActivityFeedItem[]
  isLoading: boolean
  error: Error | null
}

export function useDashboardAnalytics(): UseDashboardAnalyticsResult {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('week')
  const [summaryData, setSummaryData] = useState<{
    totalCases: number
    totalDrafts: number
    totalClients: number
    hrsSaved: number
  } | null>(null)
  const [chartDataRaw, setChartDataRaw] = useState<{
    weekly: ChartDataPointApi[]
    monthly: ChartDataPointApi[]
  } | null>(null)
  const [activityData, setActivityData] = useState<
    { type: string; caseTitle: string; description: string; timestamp: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch all dashboard data in parallel
        const [summaryRes, chartRes, activityRes] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getActivityChart(),
          dashboardApi.getRecentActivity(),
        ])

        if (summaryRes.data) {
          setSummaryData({
            totalCases: summaryRes.data.totalCases,
            totalDrafts: summaryRes.data.totalDrafts,
            totalClients: summaryRes.data.totalClients,
            hrsSaved: summaryRes.data.hrsSaved,
          })
        }

        if (chartRes.data) {
          setChartDataRaw(chartRes.data)
        }

        if (activityRes.data) {
          setActivityData(activityRes.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const chartData = useMemo(() => {
    if (!chartDataRaw) return []
    const data = chartPeriod === 'week' ? chartDataRaw.weekly : chartDataRaw.monthly
    return mapChartData(data)
  }, [chartDataRaw, chartPeriod])

  const aiStats: AiProductivityStats = useMemo(() => {
    if (!summaryData) {
      return {
        timeSavedHours: 0,
        draftsGenerated: 0,
        docsProcessed: 0,
        successRate: 0,
      }
    }
    return {
      timeSavedHours: Math.round(summaryData.hrsSaved * 10) / 10,
      draftsGenerated: summaryData.totalDrafts,
      docsProcessed: summaryData.totalCases,
      successRate: 100,
    }
  }, [summaryData])

  const activityFeed: ActivityFeedItem[] = useMemo(() => {
    return activityData.map((item, index) => ({
      id: String(index),
      type: mapActivityType(item.type),
      title: item.caseTitle,
      description: item.description,
      timestamp: item.timestamp,
    }))
  }, [activityData])

  return {
    aiStats,
    chartData,
    chartPeriod,
    setChartPeriod,
    activityFeed,
    isLoading,
    error,
  }
}

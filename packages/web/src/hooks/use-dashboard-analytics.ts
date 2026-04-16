import { useState, useEffect } from 'react'
import { dashboardApi } from '@knowlex/core/api/dashboard-api'
import type { RecentCase, RecentClient, RecentDocument } from '@knowlex/core/api/dashboard-api'

interface UseDashboardAnalyticsResult {
  totalCases: number
  activeCases: number
  totalClients: number
  recentCases: RecentCase[]
  recentClients: RecentClient[]
  recentDocuments: RecentDocument[]
  isLoading: boolean
  error: Error | null
}

export function useDashboardAnalytics(): UseDashboardAnalyticsResult {
  const [totalCases, setTotalCases] = useState(0)
  const [activeCases, setActiveCases] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [recentCases, setRecentCases] = useState<RecentCase[]>([])
  const [recentClients, setRecentClients] = useState<RecentClient[]>([])
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setIsLoading(true)
      setError(null)

      try {
        const [summaryRes, activityRes] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getRecentActivity(),
        ])

        if (cancelled) return

        if (summaryRes.data) {
          setTotalCases(summaryRes.data.totalCases)
          setActiveCases(summaryRes.data.activeCases)
          setTotalClients(summaryRes.data.totalClients)
        }

        if (activityRes.data) {
          setRecentCases(activityRes.data.recentCases ?? [])
          setRecentClients(activityRes.data.recentClients ?? [])
          setRecentDocuments(activityRes.data.recentDocuments ?? [])
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [])

  return {
    totalCases,
    activeCases,
    totalClients,
    recentCases,
    recentClients,
    recentDocuments,
    isLoading,
    error,
  }
}

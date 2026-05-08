import { useState, useEffect, useCallback } from 'react'
import { caseApi, clientApi, ApiError } from '@knowlex/core/api'
import { mapBackendCases, mapBackendClient } from '@knowlex/core/mappers'
import type { Case, Client } from '@knowlex/core/types'

interface DashboardStats {
  totalCases: number
  activeCases: number
  totalClients: number
  upcomingHearings: number
}

interface UseDashboardDataResult {
  cases: Case[]
  clients: Client[]
  stats: DashboardStats
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useDashboardData(): UseDashboardDataResult {
  const [cases, setCases] = useState<Case[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    upcomingHearings: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch cases (larger page to compute hearings) and clients in parallel
      const [casesResponse, clientsResponse] = await Promise.all([
        caseApi.getAll({ page: 0, size: 50 }),
        clientApi.getAll({ page: 0, size: 10 }),
      ])

      let mappedCases: Case[] = []
      let totalCases = 0

      if (casesResponse.status === 'success') {
        mappedCases = mapBackendCases(casesResponse.data.content)
        totalCases = casesResponse.data.totalElements
        setCases(mappedCases)
      }

      let totalClients = 0
      if (clientsResponse.status === 'success') {
        const mappedClients = clientsResponse.data.content.map(mapBackendClient)
        totalClients = clientsResponse.data.totalElements
        setClients(mappedClients)
      }

      // Compute stats from real data
      const now = new Date()
      const activeCases = mappedCases.filter(
        (c) => c.status === 'active' || c.status === 'on-hold'
      ).length

      const upcomingHearings = mappedCases.filter(
        (c) => c.nextHearingDate && new Date(c.nextHearingDate) >= now
      ).length

      setStats({ totalCases, activeCases, totalClients, upcomingHearings })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch dashboard data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    cases,
    clients,
    stats,
    isLoading,
    error,
    refresh: fetchData,
  }
}

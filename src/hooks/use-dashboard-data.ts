// Hook for fetching aggregated dashboard data

import { useState, useEffect, useCallback } from 'react'
import { caseApi, clientApi, ApiError } from '@/services/api'
import { mapBackendCases, mapBackendClient } from '@/services/mappers'
import type { Case, Client, ChatSession } from '@/types'

interface UseDashboardDataResult {
  cases: Case[]
  clients: Client[]
  chatSessions: ChatSession[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useDashboardData(): UseDashboardDataResult {
  const [cases, setCases] = useState<Case[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [chatSessions] = useState<ChatSession[]>([]) // Will be populated from local storage or API later
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch recent cases and clients in parallel
      const [casesResponse, clientsResponse] = await Promise.all([
        caseApi.getAll({ page: 0, size: 10 }),
        clientApi.getAll({ page: 0, size: 10 }),
      ])

      if (casesResponse.status === 'success') {
        const mappedCases = mapBackendCases(casesResponse.data.content)
        setCases(mappedCases)
      }

      if (clientsResponse.status === 'success') {
        const mappedClients = clientsResponse.data.content.map(mapBackendClient)
        setClients(mappedClients)
      }

      // Load chat sessions from localStorage (since there's no backend yet)
      try {
        const storedSessions = localStorage.getItem('ai_research_sessions')
        if (storedSessions) {
          // Sessions will be loaded by the AI Research component
          // This is just a placeholder for future integration
          JSON.parse(storedSessions)
        }
      } catch {
        // Ignore localStorage errors
      }
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
    chatSessions,
    isLoading,
    error,
    refresh: fetchData,
  }
}

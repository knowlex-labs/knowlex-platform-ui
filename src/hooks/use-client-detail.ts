// Hook for fetching a single client with associated case

import { useState, useEffect, useCallback } from 'react'
import { clientApi, caseApi, ApiError } from '@/services/api'
import { mapBackendClient, mapBackendCase } from '@/services/mappers'
import { getMockActivities, getMockAIResearch } from '@/data/mock-activities'
import type { ClientDetailView } from '@/types'

interface UseClientDetailResult {
  client: ClientDetailView | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useClientDetail(clientId: string | null): UseClientDetailResult {
  const [client, setClient] = useState<ClientDetailView | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setClient(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch client
      const clientResponse = await clientApi.getById(clientId)

      if (clientResponse.status !== 'success') {
        throw new Error(clientResponse.message)
      }

      const backendClient = clientResponse.data
      const mappedClient = mapBackendClient(backendClient)

      // Fetch associated case if exists
      let mappedCase = null
      if (backendClient.caseId) {
        try {
          const caseResponse = await caseApi.getById(backendClient.caseId)
          if (caseResponse.status === 'success') {
            mappedCase = mapBackendCase(caseResponse.data)
          }
        } catch {
          // Case fetch failed, proceed without case data
        }
      }

      // Use mock data for activities and AI research (demo data)
      const activities = getMockActivities(clientId)
      const aiResearch = getMockAIResearch(clientId)

      const clientDetail: ClientDetailView = {
        ...mappedClient,
        case: mappedCase,
        activities,
        aiResearch,
      }

      setClient(clientDetail)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch client'
      setError(message)
      setClient(null)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  return {
    client,
    isLoading,
    error,
    refresh: fetchClient,
  }
}

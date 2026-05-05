// Hook for fetching a single client with associated case

import { useState, useEffect, useCallback } from 'react'
import { clientApi, caseApi, ApiError } from '@knowlex/core/api'
import { mapBackendClient, mapBackendCase } from '@knowlex/core/mappers'
import type { ClientDetailView } from '@knowlex/core/types'

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

      // Fetch associated cases
      const caseIds = backendClient.caseIds ?? []
      const casePromises = caseIds.map((cId) =>
        caseApi.getById(cId).catch(() => null)
      )
      const caseResponses = await Promise.all(casePromises)
      const mappedCases = caseResponses
        .filter((r) => r?.status === 'success' && r.data)
        .map((r) => mapBackendCase(r!.data))

      const clientDetail: ClientDetailView = {
        ...mappedClient,
        cases: mappedCases,
        activities: [],
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

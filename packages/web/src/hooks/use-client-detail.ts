// Hook for fetching a single client. The backend response now bundles
// `caseSummaries` (with latest activity), so the client-detail header doesn't
// need to fetch each linked case separately. We synthesize a lightweight
// Case[] from the summaries to keep ClientDetailView's shape stable.

import { useState, useEffect, useCallback } from 'react'
import { clientApi, ApiError } from '@knowlex/core/api'
import { mapBackendClient } from '@knowlex/core/mappers'
import type { Case, ClientDetailView } from '@knowlex/core/types'

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
      const clientResponse = await clientApi.getById(clientId)

      if (clientResponse.status !== 'success') {
        throw new Error(clientResponse.message)
      }

      const mappedClient = mapBackendClient(clientResponse.data)

      const cases: Case[] = mappedClient.caseSummaries.map((s) => ({
        id: s.caseId,
        caseNumber: s.caseNumber,
        caseType: null,
        status: s.caseStatus,
        caseTitle: s.caseTitle,
        judgeName: null,
        courtName: s.courtName,
        courtLocation: null,
        nextHearingDate: s.nextHearingDate,
        createdAt: mappedClient.createdAt,
        updatedAt: mappedClient.updatedAt,
      }))

      const clientDetail: ClientDetailView = {
        ...mappedClient,
        cases,
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

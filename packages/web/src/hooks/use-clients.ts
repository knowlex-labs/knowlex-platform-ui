// Hook for fetching paginated client list.
// The list response now includes lightweight `caseSummaries`, so we no longer
// fetch each case individually — `client.cases` is synthesized from those summaries.

import { useState, useEffect, useCallback } from 'react'
import { clientApi, ApiError } from '@knowlex/core/api'
import { mapBackendClient } from '@knowlex/core/mappers'
import { getPaginationMeta } from '@knowlex/core/utils'
import type { ClientWithCase, Case } from '@knowlex/core/types'

interface UseClientsOptions {
  page?: number
  pageSize?: number
  q?: string
}

interface UseClientsResult {
  clients: ClientWithCase[]
  isLoading: boolean
  error: string | null
  totalElements: number
  totalPages: number
  currentPage: number
  refresh: () => void
  setPage: (page: number) => void
}

export function useClients(options: UseClientsOptions = {}): UseClientsResult {
  const { page: initialPage = 0, pageSize = 20, q } = options

  const [clients, setClients] = useState<ClientWithCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const clientsResponse = await clientApi.getAll({
        page: currentPage,
        size: pageSize,
        q,
      })

      if (clientsResponse.status !== 'success') {
        throw new Error(clientsResponse.message)
      }

      const paginatedData = clientsResponse.data
      const mappedClients = paginatedData.content.map(mapBackendClient)

      // Synthesize the minimal Case[] the list UI needs (id + status + a couple of
      // display fields) directly from caseSummaries — no extra round-trips.
      const clientsWithCases: ClientWithCase[] = mappedClients.map((client) => ({
        ...client,
        cases: client.caseSummaries.map((s): Case => ({
          id: s.caseId,
          caseNumber: s.caseNumber,
          caseType: null,
          status: s.caseStatus,
          caseTitle: s.caseTitle,
          judgeName: null,
          courtName: s.courtName,
          courtLocation: null,
          nextHearingDate: s.nextHearingDate,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        })),
      }))

      setClients(clientsWithCases)
      const pagination = getPaginationMeta(paginatedData)
      setTotalElements(pagination.totalElements)
      setTotalPages(pagination.totalPages)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch clients'
      setError(message)
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, q])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    setCurrentPage(0)
  }, [q, pageSize])

  const setPage = useCallback((page: number) => {
    if (page < 0) {
      setCurrentPage(0)
      return
    }
    if (totalPages > 0 && page >= totalPages) {
      setCurrentPage(totalPages - 1)
      return
    }
    setCurrentPage(page)
  }, [totalPages])

  return {
    clients,
    isLoading,
    error,
    totalElements,
    totalPages,
    currentPage,
    refresh: fetchClients,
    setPage,
  }
}

// Hook for fetching paginated client list with associated cases

import { useState, useEffect, useCallback } from 'react'
import { clientApi, caseApi, ApiError } from '@/services/api'
import { mapBackendClient, mapBackendCase } from '@/services/mappers'
import type { ClientWithCase } from '@/types'

interface UseClientsOptions {
  page?: number
  pageSize?: number
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
  const { page: initialPage = 0, pageSize = 20 } = options

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
      // Fetch clients
      const clientsResponse = await clientApi.getAll({
        page: currentPage,
        size: pageSize,
      })

      if (clientsResponse.status !== 'success') {
        throw new Error(clientsResponse.message)
      }

      const paginatedData = clientsResponse.data
      const backendClients = paginatedData.content
      const mappedClients = backendClients.map(mapBackendClient)

      // Fetch associated cases for each client
      const allCaseIds = [...new Set(backendClients.flatMap((c) => c.caseIds ?? []))]

      const casePromises = allCaseIds.map((id) =>
        caseApi.getById(id).catch(() => null)
      )
      const caseResponses = await Promise.all(casePromises)

      // Create a map of caseId -> Case
      const casesMap = new Map<string, ReturnType<typeof mapBackendCase>>()
      caseResponses.forEach((response) => {
        if (response?.status === 'success' && response.data) {
          const mappedCase = mapBackendCase(response.data)
          casesMap.set(mappedCase.id, mappedCase)
        }
      })

      // Combine clients with their cases
      const clientsWithCases: ClientWithCase[] = mappedClients.map((client) => ({
        ...client,
        cases: client.caseIds
          .map((cId) => casesMap.get(cId))
          .filter((c): c is NonNullable<typeof c> => c != null),
      }))

      setClients(clientsWithCases)
      setTotalElements(paginatedData.totalElements)
      setTotalPages(paginatedData.totalPages)
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
  }, [currentPage, pageSize])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

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

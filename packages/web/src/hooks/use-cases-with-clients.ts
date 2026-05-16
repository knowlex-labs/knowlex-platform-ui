// Hook for fetching cases with associated client names

import { useState, useEffect, useCallback } from 'react'
import { caseApi, clientApi, ApiError } from '@knowlex/core/api'
import { mapBackendCases, mapBackendClient } from '@knowlex/core/mappers'
import { getPaginationMeta } from '@knowlex/core/utils'
import type { Case, BackendCaseStatus } from '@knowlex/core/types'

export interface CaseWithClient extends Case {
  clientName: string | null
  clientId: string | null
}

interface UseCasesWithClientsOptions {
  page?: number
  pageSize?: number
  status?: BackendCaseStatus
  q?: string
}

export interface ClientOption {
  id: string
  name: string
}

interface UseCasesWithClientsResult {
  cases: CaseWithClient[]
  clients: ClientOption[]
  isLoading: boolean
  error: string | null
  totalElements: number
  totalPages: number
  currentPage: number
  refresh: () => void
  setPage: (page: number) => void
}

export function useCasesWithClients(
  options: UseCasesWithClientsOptions = {}
): UseCasesWithClientsResult {
  const { page: initialPage = 0, pageSize = 20, status, q } = options

  const [cases, setCases] = useState<CaseWithClient[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)

  const fetchCases = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch cases
      const casesResponse = await caseApi.getAll({
        page: currentPage,
        size: pageSize,
        status,
        q,
      })

      if (casesResponse.status !== 'success') {
        throw new Error(casesResponse.message)
      }

      const paginatedData = casesResponse.data
      const mappedCases = mapBackendCases(paginatedData.content)

      // Fetch all clients to create a lookup map
      // In production, you'd want a more efficient API endpoint
      const clientsResponse = await clientApi.getAll({ page: 0, size: 100 })
      const clientMap = new Map<string, string>()
      const clientIdByCaseId = new Map<string, string>()
      const clientList: ClientOption[] = []

      if (clientsResponse.status === 'success') {
        clientsResponse.data.content.forEach((backendClient) => {
          const client = mapBackendClient(backendClient)
          clientMap.set(client.id, client.name)
          clientList.push({ id: client.id, name: client.name })
          client.caseIds.forEach((cId) => {
            clientIdByCaseId.set(cId, client.id)
          })
        })
      }

      setClients(clientList)

      // Combine cases with client names
      const casesWithClients: CaseWithClient[] = mappedCases.map((caseItem) => {
        const clientId = clientIdByCaseId.get(caseItem.id) ?? null
        return {
          ...caseItem,
          clientId,
          clientName: clientId ? clientMap.get(clientId) ?? null : null,
        }
      })

      setCases(casesWithClients)
      const pagination = getPaginationMeta(paginatedData)
      setTotalElements(pagination.totalElements)
      setTotalPages(pagination.totalPages)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch cases'
      setError(message)
      setCases([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, status, q])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  useEffect(() => {
    setCurrentPage(0)
  }, [q, status, pageSize])

  useEffect(() => {
    if (totalPages <= 0) return
    if (currentPage < totalPages) return
    setCurrentPage(totalPages - 1)
  }, [currentPage, totalPages])

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
    cases,
    clients,
    isLoading,
    error,
    totalElements,
    totalPages,
    currentPage,
    refresh: fetchCases,
    setPage,
  }
}

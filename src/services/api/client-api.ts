// Client API service

import { apiClient } from './api-client'
import type {
  ApiResponse,
  BackendCase,
  BackendClient,
  BackendClientType,
  CreateClientRequest,
  PaginatedData,
  UpdateClientRequest,
} from '@/types'

const CLIENTS_ENDPOINT = '/api/v1/clients'

export interface GetClientsParams {
  page?: number
  size?: number
  clientType?: BackendClientType
}

export const clientApi = {
  create: (data: CreateClientRequest): Promise<ApiResponse<BackendClient>> => {
    return apiClient.post<ApiResponse<BackendClient>>(CLIENTS_ENDPOINT, data)
  },

  getById: (id: string): Promise<ApiResponse<BackendClient>> => {
    return apiClient.get<ApiResponse<BackendClient>>(`${CLIENTS_ENDPOINT}/${id}`)
  },

  getAll: (params: GetClientsParams = {}): Promise<ApiResponse<PaginatedData<BackendClient>>> => {
    const { page = 0, size = 20, clientType } = params
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(size),
    })
    if (clientType) {
      searchParams.append('clientType', clientType)
    }
    return apiClient.get<ApiResponse<PaginatedData<BackendClient>>>(
      `${CLIENTS_ENDPOINT}?${searchParams}`
    )
  },

  update: (id: string, data: UpdateClientRequest): Promise<ApiResponse<BackendClient>> => {
    return apiClient.put<ApiResponse<BackendClient>>(`${CLIENTS_ENDPOINT}/${id}`, data)
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`${CLIENTS_ENDPOINT}/${id}`)
  },

  linkCase: (clientId: string, caseId: string): Promise<ApiResponse<null>> => {
    return apiClient.post<ApiResponse<null>>(`${CLIENTS_ENDPOINT}/${clientId}/cases/${caseId}`, {})
  },

  unlinkCase: (clientId: string, caseId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`${CLIENTS_ENDPOINT}/${clientId}/cases/${caseId}`)
  },

  getCases: (clientId: string): Promise<ApiResponse<BackendCase[]>> => {
    return apiClient.get<ApiResponse<BackendCase[]>>(`${CLIENTS_ENDPOINT}/${clientId}/cases`)
  },
}

// Case API service

import { apiClient } from './api-client'
import type {
  ApiResponse,
  BackendCase,
  BackendCaseStatus,
  BackendClient,
  CreateCaseRequest,
  PaginatedData,
  UpdateCaseRequest,
} from '@/types'

const CASES_ENDPOINT = '/api/v1/cases'

export interface GetCasesParams {
  page?: number
  size?: number
  status?: BackendCaseStatus
}

export const caseApi = {
  create: (data: CreateCaseRequest): Promise<ApiResponse<BackendCase>> => {
    return apiClient.post<ApiResponse<BackendCase>>(CASES_ENDPOINT, data)
  },

  getById: (id: string): Promise<ApiResponse<BackendCase>> => {
    return apiClient.get<ApiResponse<BackendCase>>(`${CASES_ENDPOINT}/${id}`)
  },

  getAll: (params: GetCasesParams = {}): Promise<ApiResponse<PaginatedData<BackendCase>>> => {
    const { page = 0, size = 20, status } = params
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(size),
    })
    if (status) {
      searchParams.append('status', status)
    }
    return apiClient.get<ApiResponse<PaginatedData<BackendCase>>>(
      `${CASES_ENDPOINT}?${searchParams}`
    )
  },

  update: (id: string, data: UpdateCaseRequest): Promise<ApiResponse<BackendCase>> => {
    return apiClient.put<ApiResponse<BackendCase>>(`${CASES_ENDPOINT}/${id}`, data)
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`${CASES_ENDPOINT}/${id}`)
  },

  getClients: (caseId: string): Promise<ApiResponse<BackendClient[]>> => {
    return apiClient.get<ApiResponse<BackendClient[]>>(`${CASES_ENDPOINT}/${caseId}/clients`)
  },
}

// Case API service

import { apiClient } from './api-client'
import type {
  ApiResponse,
  BackendCase,
  BackendCaseStatus,
  BackendClient,
  CaseTypeOption,
  CreateCaseRequest,
  PaginatedData,
  UpdateCaseRequest,
  UpdateRespondentRequest,
  Judgment,
} from '@/types'

const CASES_ENDPOINT = '/api/v1/cases'

export interface CaseOverviewSummary {
  documentCount: number
  judgmentCount: number
  draftCount: number
  summaryCount: number
}

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

  addJudgment: (caseId: string, judgmentId: string, collectionId?: string): Promise<ApiResponse<unknown>> => {
    return apiClient.post<ApiResponse<unknown>>(`${CASES_ENDPOINT}/${caseId}/judgments`, { judgmentId, collectionId })
  },

  getJudgments: (caseId: string): Promise<ApiResponse<Judgment[]>> => {
    return apiClient.get<ApiResponse<Judgment[]>>(`${CASES_ENDPOINT}/${caseId}/judgments`)
  },

  getTypes: (): Promise<ApiResponse<CaseTypeOption[]>> => {
    return apiClient.get<ApiResponse<CaseTypeOption[]>>(`${CASES_ENDPOINT}/types`)
  },

  getOverviewSummary: (caseId: string): Promise<ApiResponse<CaseOverviewSummary>> => {
    return apiClient.get<ApiResponse<CaseOverviewSummary>>(`${CASES_ENDPOINT}/${caseId}/overview/summary`)
  },

  updateRespondent: (caseId: string, data: UpdateRespondentRequest): Promise<ApiResponse<BackendCase>> => {
    return apiClient.put<ApiResponse<BackendCase>>(`${CASES_ENDPOINT}/${caseId}/respondent`, data)
  },
}

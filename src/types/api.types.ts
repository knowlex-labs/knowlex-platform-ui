// Backend API type definitions matching the integration docs

// Enums from backend
export type BackendClientType = 'INDIVIDUAL' | 'COMPANY'
export type BackendCaseType = 'CIVIL' | 'CRIMINAL' | 'FAMILY' | 'CORPORATE'
export type BackendCaseStatus = 'ACTIVE' | 'PENDING' | 'CLOSED' | 'APPEALED' | 'BLOCKED'

// Backend Case entity (exact API response type)
export interface BackendCase {
  id: string
  caseNumber: string | null
  caseType: BackendCaseType | null
  caseStatus: BackendCaseStatus
  caseTitle: string | null
  judgeName: string | null
  courtName: string | null
  courtLocation: string | null
  nextHearingDate: string | null // ISO date string YYYY-MM-DD
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
}

// Backend Client entity (exact API response type)
export interface BackendClient {
  id: string
  name: string
  email: string | null
  phoneNumber: string | null
  address: string | null
  clientType: BackendClientType
  caseIds: string[]
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
}

// API Response wrapper
export interface ApiResponse<T> {
  status: 'success' | 'error'
  message: string
  data: T
}

// Paginated response structure (Spring Boot Page format)
export interface PaginatedData<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      sorted: boolean
      empty: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

// Request DTOs
export interface CreateCaseRequest {
  caseNumber?: string
  caseType?: BackendCaseType
  caseStatus?: BackendCaseStatus
  caseTitle?: string
  judgeName?: string
  courtName?: string
  courtLocation?: string
  nextHearingDate?: string
}

export interface UpdateCaseRequest {
  caseNumber?: string
  caseType?: BackendCaseType
  caseStatus?: BackendCaseStatus
  caseTitle?: string
  judgeName?: string
  courtName?: string
  courtLocation?: string
  nextHearingDate?: string
}

export interface CreateClientRequest {
  name: string
  email?: string
  phoneNumber?: string
  address?: string
  clientType: BackendClientType
}

export interface UpdateClientRequest {
  name?: string
  email?: string
  phoneNumber?: string
  address?: string
  clientType?: BackendClientType
}

// Backend API type definitions matching the integration docs

// Enums from backend
export type BackendClientType = 'INDIVIDUAL' | 'COMPANY'
export type BackendCaseType = string

export interface CaseTypeOption {
  value: string
  code: string
  displayName: string
}
export type BackendCaseStatus = 'OPEN' | 'PENDING' | 'CLOSED' | 'ARCHIVED' | 'ACTIVE' | 'ON_HOLD'

// Backend Case entity (exact API response type)
export interface BackendCase {
  id: string
  title: string
  caseNumber: string | null
  caseType: BackendCaseType | null
  caseStatus: BackendCaseStatus
  clientId: string | null
  caseTitle: string | null
  judgeName: string | null
  courtName: string | null
  courtLocation: string | null
  nextHearingDate: string | null // ISO date string YYYY-MM-DD
  respondentName: string | null
  respondentDetails: Record<string, string> | null
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
}

export interface RespondentDetails {
  fatherName?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  phone?: string
  email?: string
  advocateName?: string
  advocateEnrollment?: string
  notes?: string
}

export interface UpdateRespondentRequest {
  respondentName?: string
  details?: RespondentDetails
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
  status: string
  message: string
  data: T
  requestId?: string
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
  /** Spring Boot 3 wraps pagination metadata here instead of at the top level */
  page?: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

// Request DTOs
export interface CreateCaseRequest {
  clientId?: string
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

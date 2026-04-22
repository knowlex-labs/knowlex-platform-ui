import { apiClient } from './api-client'
import type { ApiResponse } from '../types'

export interface InquiryPayload {
  name: string
  email: string
  organization: string
  message?: string
}

export interface InquiryRecord {
  id: string
  name: string
  email: string
  organization: string
  message: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export const inquiriesApi = {
  submit: (payload: InquiryPayload): Promise<ApiResponse<InquiryRecord>> =>
    apiClient.post<ApiResponse<InquiryRecord>>('/api/v1/inquiries', payload),
}

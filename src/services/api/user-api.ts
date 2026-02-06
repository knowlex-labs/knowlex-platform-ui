// User API service

import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

const USER_ENDPOINT = '/api/v1/user'

export interface BackendUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  mobileNumber?: string
  createdAt: string
}

export const userApi = {
  getCurrentUser: (): Promise<ApiResponse<BackendUser>> => {
    return apiClient.get<ApiResponse<BackendUser>>(`${USER_ENDPOINT}/me`)
  },
}

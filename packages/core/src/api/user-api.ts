// User API service

import { apiClient } from './api-client'
import type { ApiResponse } from '../types'

const USER_ENDPOINT = '/api/v1/user'

export interface BackendUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  mobileNumber?: string
  bench?: string
  admin?: boolean
  createdAt: string
}

export const userApi = {
  getCurrentUser: (): Promise<ApiResponse<BackendUser>> => {
    return apiClient.get<ApiResponse<BackendUser>>(`${USER_ENDPOINT}/me`)
  },

  updateProfile: (data: { bench?: string }): Promise<ApiResponse<BackendUser>> => {
    return apiClient.put<ApiResponse<BackendUser>>(`${USER_ENDPOINT}/me`, data)
  },
}

// API Client with authentication and error handling
import { config } from '@/config/env'

const API_BASE_URL = config.apiBaseUrl

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super('Your session has expired. Please log in again.', 401)
    this.name = 'SessionExpiredError'
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

function getUserId(): string | null {
  return localStorage.getItem('auth_user_id')
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const userId = getUserId()
  if (userId) {
    headers['x-user-id'] = userId
  }

  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Check for 401 - session expired
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
      throw new SessionExpiredError()
    }

    let errorData: unknown
    try {
      errorData = await response.json()
    } catch {
      // Response body might not be JSON
    }

    const message =
      errorData && typeof errorData === 'object' && 'message' in errorData
        ? String((errorData as { message: string }).message)
        : `HTTP error ${response.status}`

    // Check for 403 - subscription required
    if (response.status === 403 && message.toLowerCase().includes('no active subscription')) {
      window.dispatchEvent(new CustomEvent('subscription:required'))
    }

    throw new ApiError(message, response.status, errorData)
  }

  return response.json()
}

function getAdminAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('admin_auth_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const userId = localStorage.getItem('admin_user_id')
  if (userId) {
    headers['x-user-id'] = userId
  }

  return headers
}

export const adminApiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    })
    return handleResponse<T>(response)
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    })
    return handleResponse<T>(response)
  },
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    return handleResponse<T>(response)
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse<T>(response)
  },
}

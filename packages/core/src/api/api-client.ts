// API Client with authentication and error handling
import { getAdapters } from './runtime'
import { getAuthHeaders, getAdminAuthHeaders } from './auth-headers'

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

function getBaseUrl(): string {
  return getAdapters().env.apiBaseUrl
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Check for 401 - session expired
    if (response.status === 401) {
      getAdapters().eventBus.dispatch('auth:session-expired')
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
      getAdapters().eventBus.dispatch('subscription:required')
    }

    throw new ApiError(message, response.status, errorData)
  }

  return response.json() as Promise<T>
}

export const adminApiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    })
    return handleResponse<T>(response)
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    })
    return handleResponse<T>(response)
  },
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    })
    return handleResponse<T>(response)
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  patch: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    })
    return handleResponse<T>(response)
  },
}

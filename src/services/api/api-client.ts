// API Client with authentication and error handling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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

    throw new ApiError(message, response.status, errorData)
  }

  return response.json()
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

// Auth API Service - Real backend authentication endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName?: string
  lastName?: string
  mobileNumber?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface GoogleAuthRequest {
  idToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
    mobileNumber?: string
    createdAt: string
  }
}

export interface AuthError {
  message: string
  status: number
}

async function handleAuthResponse(response: Response): Promise<AuthResponse> {
  const data = await response.json()

  if (!response.ok) {
    const errorMessage = data.message || `Authentication failed (${response.status})`
    throw { message: errorMessage, status: response.status } as AuthError
  }

  return data
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return handleAuthResponse(response)
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return handleAuthResponse(response)
  },

  googleAuth: async (idToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })
    return handleAuthResponse(response)
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
    return handleAuthResponse(response)
  },
}

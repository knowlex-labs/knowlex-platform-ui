// Auth API Service - Real backend authentication endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Helper to check if API response indicates success (handles both 'success' and 'status' from backend)
function isApiSuccess(_response: { success?: boolean; status?: string }): boolean {
  return _response.success === true || _response.status === 'success'
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName?: string
  lastName?: string
  mobileNumber?: string
  city?: string
  bench?: string
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

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export interface AuthTokens {
  token: string
  refreshToken: string
  userId: string
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

/**
 * Decode JWT token payload without verification (client-side only)
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Extract user info from JWT token
 */
function extractUserFromToken(token: string): AuthResponse['user'] | null {
  const decoded = decodeJWT(token)
  if (!decoded) {
    return null
  }

  // JWT typically has 'sub' for user ID, or custom claims
  // Adjust these fields based on your actual JWT structure
  const userId = decoded.sub || decoded.userId || decoded.id || decoded.user?.id
  const username = decoded.username || decoded.preferred_username || decoded.user?.username || ''
  const email = decoded.email || decoded.user?.email || ''
  const firstName = decoded.firstName || decoded.given_name || decoded.first_name || decoded.user?.firstName || ''
  const lastName = decoded.lastName || decoded.family_name || decoded.last_name || decoded.user?.lastName || ''
  const mobileNumber = decoded.mobileNumber || decoded.phone_number || decoded.phone || decoded.user?.mobileNumber || undefined
  
  // Use iat (issued at) as fallback for createdAt, or current date
  let createdAt: string
  if (decoded.createdAt) {
    createdAt = typeof decoded.createdAt === 'string' 
      ? decoded.createdAt 
      : new Date(decoded.createdAt).toISOString()
  } else if (decoded.iat) {
    createdAt = new Date(decoded.iat * 1000).toISOString()
  } else {
    createdAt = new Date().toISOString()
  }

  // Validate that we have at least an ID
  if (!userId) {
    console.error('JWT token missing user ID', decoded)
    return null
  }

  return {
    id: String(userId),
    username,
    email,
    firstName,
    lastName,
    mobileNumber,
    createdAt,
  }
}

async function handleAuthResponse(response: Response): Promise<AuthResponse> {
  const apiResponse: ApiResponse<AuthTokens> = await response.json()

  if (!response.ok || !isApiSuccess(apiResponse)) {
    const errorMessage = apiResponse.message || `Authentication failed (${response.status})`
    throw { message: errorMessage, status: response.status } as AuthError
  }

  if (!apiResponse.data) {
    throw { message: 'No data in response', status: response.status } as AuthError
  }

  // Extract user info from JWT token
  const userFromToken = extractUserFromToken(apiResponse.data.token)
  if (!userFromToken) {
    throw { message: 'Failed to extract user information from token', status: 500 } as AuthError
  }

  // Use userId from API response if available, otherwise fall back to JWT extraction
  const userId = apiResponse.data.userId || userFromToken.id

  // Create user object with userId from API response
  const user = {
    ...userFromToken,
    id: userId, // Ensure we use the userId from API response
  }

  return {
    token: apiResponse.data.token,
    refreshToken: apiResponse.data.refreshToken,
    user,
  }
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const apiResponse: ApiResponse<null> = await response.json()

    if (!response.ok || !isApiSuccess(apiResponse)) {
      const errorMessage = apiResponse.message || `Registration failed (${response.status})`
      throw { message: errorMessage, status: response.status } as AuthError
    }

    // Registration doesn't return tokens - user needs to login separately
    return
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

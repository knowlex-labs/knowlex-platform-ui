// Auth API Service - Real backend authentication endpoints
import { getAdapters } from './runtime'
import { getAuthHeaders } from './auth-headers'
import type { User } from '../types/user.types'

function getBaseUrl(): string {
  return getAdapters().env.apiBaseUrl
}

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

export interface AuthUserPayload {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  mobileNumber?: string
  emailVerified?: boolean
  emailVerifiedAt?: string | null
  plan?: string
  createdAt?: string
}

export interface AuthTokens {
  token: string
  refreshToken: string
  userId: string
  user?: AuthUserPayload
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
    emailVerified?: boolean
    emailVerifiedAt?: string | null
    plan?: string
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

  // Prefer the nested user object returned by the backend; fall back to
  // JWT extraction for older responses that don't include it. Token is also
  // used to backfill createdAt when the nested user omits it.
  const nestedUser = apiResponse.data.user
  const userFromToken = extractUserFromToken(apiResponse.data.token)

  if (!nestedUser && !userFromToken) {
    throw { message: 'Failed to extract user information from token', status: 500 } as AuthError
  }

  const userId = apiResponse.data.userId || nestedUser?.id || userFromToken?.id
  if (!userId) {
    throw { message: 'Failed to resolve user id from auth response', status: 500 } as AuthError
  }

  const user: AuthResponse['user'] = nestedUser
    ? {
        id: userId,
        username: nestedUser.username,
        email: nestedUser.email,
        firstName: nestedUser.firstName,
        lastName: nestedUser.lastName,
        mobileNumber: nestedUser.mobileNumber,
        emailVerified: nestedUser.emailVerified,
        emailVerifiedAt: nestedUser.emailVerifiedAt ?? null,
        plan: nestedUser.plan,
        createdAt: nestedUser.createdAt ?? userFromToken?.createdAt ?? new Date().toISOString(),
      }
    : {
        ...(userFromToken as AuthResponse['user']),
        id: userId,
      }

  return {
    token: apiResponse.data.token,
    refreshToken: apiResponse.data.refreshToken,
    user,
  }
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const apiResponse = await response.json() as ApiResponse<null>

    if (!response.ok || !isApiSuccess(apiResponse)) {
      const errorMessage = apiResponse.message || `Registration failed (${response.status})`
      throw { message: errorMessage, status: response.status } as AuthError
    }

    // Registration doesn't return tokens - user needs to login separately
    return
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return handleAuthResponse(response)
  },

  googleAuth: async (idToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })
    return handleAuthResponse(response)
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
    return handleAuthResponse(response)
  },

  // Always resolves; backend returns a generic 200 regardless of whether
  // the email exists, to prevent user enumeration.
  forgotPassword: async (email: string): Promise<void> => {
    try {
      await fetch(`${getBaseUrl()}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // network errors are intentionally swallowed — the UX is always "check your inbox"
    }
  },

  validateResetToken: async (token: string): Promise<{ valid: boolean }> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/v1/auth/reset-password/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const apiResponse = await response.json() as ApiResponse<{ valid: boolean }>
      if (!response.ok || !isApiSuccess(apiResponse) || !apiResponse.data) {
        return { valid: false }
      }
      return { valid: apiResponse.data.valid === true }
    } catch {
      return { valid: false }
    }
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    const apiResponse = await response.json() as ApiResponse<null>
    if (!response.ok || !isApiSuccess(apiResponse)) {
      const errorMessage = apiResponse.message || `Password reset failed (${response.status})`
      throw { message: errorMessage, status: response.status } as AuthError
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ token: string; refreshToken: string }> => {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const apiResponse = await response.json() as ApiResponse<{ token: string; refreshToken: string }>
    if (!response.ok || !isApiSuccess(apiResponse) || !apiResponse.data) {
      const errorMessage = apiResponse.message || `Password change failed (${response.status})`
      throw { message: errorMessage, status: response.status } as AuthError
    }
    return {
      token: apiResponse.data.token,
      refreshToken: apiResponse.data.refreshToken,
    }
  },

  verifyEmail: async (token: string): Promise<{ user: User }> => {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const apiResponse = await response.json() as ApiResponse<{ user: AuthUserPayload }>
    if (!response.ok || !isApiSuccess(apiResponse) || !apiResponse.data?.user) {
      const errorMessage = apiResponse.message || `Email verification failed (${response.status})`
      throw { message: errorMessage, status: response.status } as AuthError
    }
    const u = apiResponse.data.user
    const user: User = {
      id: u.id,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.mobileNumber,
      plan: u.plan,
      emailVerified: u.emailVerified ?? true,
      emailVerifiedAt: u.emailVerifiedAt ? new Date(u.emailVerifiedAt) : new Date(),
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    }
    return { user }
  },

  // Always resolves; backend returns a generic 200 whether the email exists
  // or is already verified.
  resendVerification: async (email: string): Promise<void> => {
    try {
      await fetch(`${getBaseUrl()}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // swallow — FE always shows the generic "check your inbox" message
    }
  },
}

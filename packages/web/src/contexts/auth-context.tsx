import * as React from 'react'
import type { AuthContextValue, AuthState, LoginCredentials, SignupData, User } from '@knowlex/core/types'
import { authApi } from '@knowlex/core/api/auth-api'
import { userApi } from '@knowlex/core/api/user-api'
import { DEMO_USER_USERNAME, DEMO_USER_PASSWORD } from '@/lib/constants'

const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const USER_ID_KEY = 'auth_user_id'

function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

function setAuthTokens(token: string | null, refreshToken: string | null, userId: string | null = null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId)
  } else {
    localStorage.removeItem(USER_ID_KEY)
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = React.useState<AuthState>({
    isAuthenticated: false,
    user: null,
  })
  const [isRestoringSession, setIsRestoringSession] = React.useState(true)

  // Restore session from localStorage on mount
  React.useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken()
      if (!token) {
        setIsRestoringSession(false)
        return
      }

      try {
        // Try to get current user to verify token is valid
        const userResponse = await userApi.getCurrentUser()
        if (userResponse.status === 'success' && userResponse.data) {
          const user: User = {
            id: userResponse.data.id,
            username: userResponse.data.username,
            email: userResponse.data.email,
            firstName: userResponse.data.firstName,
            lastName: userResponse.data.lastName,
            phone: userResponse.data.mobileNumber,
            bench: userResponse.data.bench,
            createdAt: new Date(userResponse.data.createdAt),
          }

          // Ensure userId is stored in localStorage
          localStorage.setItem(USER_ID_KEY, userResponse.data.id)

          setAuthState({
            isAuthenticated: true,
            user,
          })
        } else {
          // Token might be invalid, clear it
          setAuthTokens(null, null, null)
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        // Token might be invalid or expired, clear it
        setAuthTokens(null, null, null)
        setAuthState({
          isAuthenticated: false,
          user: null,
        })
      } finally {
        setIsRestoringSession(false)
      }
    }

    restoreSession()
  }, [])

  // Handle session expiry events
  React.useEffect(() => {
    const handleSessionExpired = () => {
      // Clear auth tokens
      setAuthTokens(null, null, null)
      setAuthState({ isAuthenticated: false, user: null })

      // Trigger toast notification
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: {
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        }
      }))
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [])

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login({
      username: credentials.username,
      password: credentials.password,
    })

    setAuthTokens(response.token, response.refreshToken, response.user.id)

    // Fetch full user details from /users/me
    try {
      const userResponse = await userApi.getCurrentUser()
      if (userResponse.status === 'success' && userResponse.data) {
        const user: User = {
          id: userResponse.data.id,
          username: userResponse.data.username,
          email: userResponse.data.email,
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          phone: userResponse.data.mobileNumber,
          bench: userResponse.data.bench,
          createdAt: new Date(userResponse.data.createdAt),
        }

        // Ensure userId is stored in localStorage (in case it differs from initial response)
        localStorage.setItem(USER_ID_KEY, userResponse.data.id)

        setAuthState({
          isAuthenticated: true,
          user,
        })
      } else {
        // Fallback to JWT data if API call fails
        const user: User = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.mobileNumber,
          createdAt: new Date(response.user.createdAt),
        }

        setAuthState({
          isAuthenticated: true,
          user,
        })
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error)
      // Fallback to JWT data if API call fails
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        phone: response.user.mobileNumber,
        createdAt: new Date(response.user.createdAt),
      }

      setAuthState({
        isAuthenticated: true,
        user,
      })
    }
  }, [])

  const signup = React.useCallback(async (data: SignupData) => {
    // Registration doesn't return tokens - user needs to login separately
    await authApi.register({
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      mobileNumber: data.mobileNumber,
      city: data.bench || data.city,
      bench: data.bench,
    })

    // After successful registration, automatically log the user in
    await login({
      username: data.username,
      password: data.password,
    })
  }, [login])

  const googleLogin = React.useCallback(async (idToken: string) => {
    const response = await authApi.googleAuth(idToken)

    setAuthTokens(response.token, response.refreshToken, response.user.id)

    // Google login users are never guests, fetch full details
    try {
      const userResponse = await userApi.getCurrentUser()
      if (userResponse.status === 'success' && userResponse.data) {
        const user: User = {
          id: userResponse.data.id,
          username: userResponse.data.username,
          email: userResponse.data.email,
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          phone: userResponse.data.mobileNumber,
          bench: userResponse.data.bench,
          createdAt: new Date(userResponse.data.createdAt),
        }

        // Ensure userId is stored in localStorage (in case it differs from initial response)
        localStorage.setItem(USER_ID_KEY, userResponse.data.id)

        setAuthState({
          isAuthenticated: true,
          user,
        })
      } else {
        // Fallback to JWT data if API call fails
        const user: User = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.mobileNumber,
          createdAt: new Date(response.user.createdAt),
        }

        setAuthState({
          isAuthenticated: true,
          user,
        })
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error)
      // Fallback to JWT data if API call fails
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        phone: response.user.mobileNumber,
        createdAt: new Date(response.user.createdAt),
      }

      setAuthState({
        isAuthenticated: true,
        user,
      })
    }
  }, [])

  const continueAsGuest = React.useCallback(async () => {
    // Login with demo user credentials instead of creating a guest user
    await login({
      username: DEMO_USER_USERNAME,
      password: DEMO_USER_PASSWORD,
    })
  }, [login])

  const updateProfile = React.useCallback(async (data: { bench?: string }) => {
    await userApi.updateProfile(data)
    setAuthState((prev) => prev.user
      ? { ...prev, user: { ...prev.user, ...data } }
      : prev
    )
  }, [])

  const logout = React.useCallback(() => {
    setAuthTokens(null, null, null)

    setAuthState({
      isAuthenticated: false,
      user: null,
    })
  }, [])

  const value: AuthContextValue = {
    ...authState,
    login,
    signup,
    googleLogin,
    continueAsGuest,
    logout,
    updateProfile,
    isRestoringSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

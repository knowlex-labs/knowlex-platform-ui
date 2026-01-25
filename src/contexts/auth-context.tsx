import * as React from 'react'
import type { AuthContextValue, AuthState, LoginCredentials, SignupData, User } from '@/types'
import { authApi } from '@/services/api/auth-api'

const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

function setAuthTokens(token: string | null, refreshToken: string | null) {
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
}

function generateGuestToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
      guest: true,
    })
  )
  const signature = btoa('guest-signature')
  return `${header}.${payload}.${signature}`
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = React.useState<AuthState>({
    isAuthenticated: false,
    isGuest: false,
    user: null,
  })

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login({
      username: credentials.username,
      password: credentials.password,
    })

    const user: User = {
      id: response.user.id,
      username: response.user.username,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      phone: response.user.mobileNumber,
      createdAt: new Date(response.user.createdAt),
    }

    setAuthTokens(response.token, response.refreshToken)

    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      user,
    })
  }, [])

  const signup = React.useCallback(async (data: SignupData) => {
    const response = await authApi.register({
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      mobileNumber: data.mobileNumber,
    })

    const user: User = {
      id: response.user.id,
      username: response.user.username,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      phone: response.user.mobileNumber,
      createdAt: new Date(response.user.createdAt),
    }

    setAuthTokens(response.token, response.refreshToken)

    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      user,
    })
  }, [])

  const googleLogin = React.useCallback(async (idToken: string) => {
    const response = await authApi.googleAuth(idToken)

    const user: User = {
      id: response.user.id,
      username: response.user.username,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      phone: response.user.mobileNumber,
      createdAt: new Date(response.user.createdAt),
    }

    setAuthTokens(response.token, response.refreshToken)

    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      user,
    })
  }, [])

  const continueAsGuest = React.useCallback(() => {
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      username: 'guest',
      email: 'guest@demo.knowlex.ai',
      firstName: 'Guest',
      lastName: 'User',
      createdAt: new Date(),
    }

    const token = generateGuestToken(guestUser.id)
    setAuthTokens(token, null)

    setAuthState({
      isAuthenticated: true,
      isGuest: true,
      user: guestUser,
    })
  }, [])

  const logout = React.useCallback(() => {
    setAuthTokens(null, null)

    setAuthState({
      isAuthenticated: false,
      isGuest: false,
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

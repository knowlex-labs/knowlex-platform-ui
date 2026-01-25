import * as React from 'react'
import type { AuthContextValue, AuthState, LoginCredentials, SignupData, User } from '@/types'

const AUTH_TOKEN_KEY = 'auth_token'

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

// Generate a mock JWT-like token for API requests
// In production, this would come from a real auth API
function generateMockToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    })
  )
  const signature = btoa('mock-signature')
  return `${header}.${payload}.${signature}`
}

function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = React.useState<AuthState>({
    isAuthenticated: false,
    isGuest: false,
    user: null,
  })

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    // Mock login - in production, this would call an API
    const mockUser: User = {
      id: 'user-1',
      username: 'advocate.sharma',
      email: credentials.email,
      firstName: 'Rajesh',
      lastName: 'Sharma',
      phone: '+91 98765 43210',
      createdAt: new Date(),
    }

    // Generate and store mock token
    const token = generateMockToken(mockUser.id)
    setAuthToken(token)

    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      user: mockUser,
    })
  }, [])

  const signup = React.useCallback(async (data: SignupData) => {
    // Mock signup - in production, this would call an API
    const mockUser: User = {
      id: 'user-' + Date.now(),
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      createdAt: new Date(),
    }

    // Generate and store mock token
    const token = generateMockToken(mockUser.id)
    setAuthToken(token)

    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      user: mockUser,
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

    // Generate and store mock token for guest
    const token = generateMockToken(guestUser.id)
    setAuthToken(token)

    setAuthState({
      isAuthenticated: true,
      isGuest: true,
      user: guestUser,
    })
  }, [])

  const logout = React.useCallback(() => {
    // Clear token on logout
    setAuthToken(null)

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

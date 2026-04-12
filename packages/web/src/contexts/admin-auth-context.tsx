import * as React from 'react'
import { authApi } from '@knowlex/core/api/auth-api'
import { adminApiClient } from '@knowlex/core/api/api-client'
import type { User, ApiResponse } from '@knowlex/core/types'
import type { BackendUser } from '@knowlex/core/api/user-api'

const ADMIN_TOKEN_KEY = 'admin_auth_token'
const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token'
const ADMIN_USER_ID_KEY = 'admin_user_id'

interface AdminAuthContextValue {
  adminUser: User | null
  isAdminAuthenticated: boolean
  isRestoringSession: boolean
  adminLogin: (username: string, password: string) => Promise<void>
  adminLogout: () => void
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | undefined>(undefined)

function setAdminTokens(token: string | null, refreshToken: string | null, userId: string | null) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
  }
  if (refreshToken) {
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
  }
  if (userId) {
    localStorage.setItem(ADMIN_USER_ID_KEY, userId)
  } else {
    localStorage.removeItem(ADMIN_USER_ID_KEY)
  }
}

function backendUserToUser(data: BackendUser): User {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.mobileNumber,
    isAdmin: data.admin,
    createdAt: new Date(data.createdAt),
  }
}

// Fetch current user using admin token directly
function fetchAdminUser(): Promise<ApiResponse<BackendUser>> {
  return adminApiClient.get<ApiResponse<BackendUser>>('/api/v1/user/me')
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = React.useState<User | null>(null)
  const [isRestoringSession, setIsRestoringSession] = React.useState(true)

  React.useEffect(() => {
    const restoreSession = async () => {
      const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY)
      if (!adminToken) {
        setIsRestoringSession(false)
        return
      }

      try {
        const userResponse = await fetchAdminUser()
        if (userResponse.status === 'success' && userResponse.data && userResponse.data.admin) {
          setAdminUser(backendUserToUser(userResponse.data))
        } else {
          setAdminTokens(null, null, null)
        }
      } catch {
        setAdminTokens(null, null, null)
      } finally {
        setIsRestoringSession(false)
      }
    }

    restoreSession()
  }, [])

  const adminLogin = React.useCallback(async (username: string, password: string) => {
    const response = await authApi.login({ username, password })
    setAdminTokens(response.token, response.refreshToken, response.user.id)

    try {
      const userResponse = await fetchAdminUser()
      if (userResponse.status === 'success' && userResponse.data && userResponse.data.admin) {
        setAdminUser(backendUserToUser(userResponse.data))
      } else {
        setAdminTokens(null, null, null)
        throw new Error('You do not have admin access.')
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'You do not have admin access.') {
        throw err
      }
      setAdminTokens(null, null, null)
      throw new Error('Failed to verify admin access.')
    }
  }, [])

  const adminLogout = React.useCallback(() => {
    setAdminTokens(null, null, null)
    setAdminUser(null)
  }, [])

  const value: AdminAuthContextValue = {
    adminUser,
    isAdminAuthenticated: adminUser !== null,
    isRestoringSession,
    adminLogin,
    adminLogout,
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

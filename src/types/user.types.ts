export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  createdAt: Date
}

export interface AuthState {
  isAuthenticated: boolean
  isGuest: boolean
  user: User | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  username: string
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  phone?: string
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  continueAsGuest: () => void
  logout: () => void
}

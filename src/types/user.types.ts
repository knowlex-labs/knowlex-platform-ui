export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isAdmin?: boolean
  createdAt: Date
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface SignupData {
  username: string
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  mobileNumber?: string
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  continueAsGuest: () => Promise<void>
  logout: () => void
  isRestoringSession?: boolean
}

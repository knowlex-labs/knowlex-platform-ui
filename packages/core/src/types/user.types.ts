export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  bench?: string
  isAdmin?: boolean
  emailVerified?: boolean
  emailVerifiedAt?: Date
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
  city?: string
  state?: string
  bench?: string
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  /** Optional — web-only demo login. Mobile omits this. */
  continueAsGuest?: () => Promise<void>
  logout: () => void
  updateProfile: (data: { bench?: string }) => Promise<void>
  /** Swap just the auth tokens (e.g. after change-password returns fresh tokens). */
  replaceTokens: (token: string, refreshToken: string) => void
  /** Merge updated user fields into context state without a network call. */
  refreshUser: (user: User) => void
  isRestoringSession?: boolean
}

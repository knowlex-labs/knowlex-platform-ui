/**
 * Environment configuration
 * All environment variables should be accessed through this file
 */

export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',

  // Google OAuth
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
} as const

// Type for the config object
export type Config = typeof config

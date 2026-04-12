import type { EnvironmentConfig } from '@knowlex/core/api/ports'

export const browserEnvConfig: EnvironmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  enablePayment: import.meta.env.VITE_ENABLE_PAYMENT === 'true',
}

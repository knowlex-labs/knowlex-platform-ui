import type { EnvironmentConfig } from '@knowlex/core/api/ports';

export const mobileEnvConfig: EnvironmentConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  enablePayment: false,
};

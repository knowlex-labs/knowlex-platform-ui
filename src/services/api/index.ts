export { apiClient, ApiError } from './api-client'
export { authApi } from './auth-api'
export type { RegisterRequest, LoginRequest, AuthResponse, AuthError } from './auth-api'
export { caseApi } from './case-api'
export type { GetCasesParams } from './case-api'
export { clientApi } from './client-api'
export type { GetClientsParams } from './client-api'
export { userApi } from './user-api'
export type { BackendUser } from './user-api'
export { workspaceApi } from './workspace-api'
export { judgmentsApi } from './judgments-api'
export type { JudgmentListParams } from './judgments-api'
export { dashboardApi } from './dashboard-api'
export type {
  DashboardSummary,
  RecentCase,
  RecentClient,
  RecentActivityItem,
  ChartDataPoint as ChartDataPointApi,
  ChartData as ChartDataApi,
  UpcomingHearing,
} from './dashboard-api'

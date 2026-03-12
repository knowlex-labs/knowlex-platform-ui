// Dashboard API service

import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

export interface RecentCase {
  id: string
  caseTitle: string
  caseNumber: string
  caseStatus: string
  updatedAt: string
}

export interface RecentClient {
  id: string
  name: string
  email?: string
  clientType: string
  updatedAt: string
}

export interface DashboardSummary {
  totalCases: number
  totalDrafts: number
  totalClients: number
  hrsSaved: number
  recentCases: RecentCase[]
  recentClients: RecentClient[]
}

export interface RecentActivityItem {
  type: 'DRAFT_GENERATED' | 'JUDGMENT_ADDED' | 'DOCUMENT_UPLOADED' | 'CASE_CREATED'
  caseTitle: string
  description: string
  timestamp: string
}

export interface ChartDataPoint {
  period: string
  caseCount: number
  draftCount: number
}

export interface ChartData {
  weekly: ChartDataPoint[]
  monthly: ChartDataPoint[]
}

export interface UpcomingHearing {
  id: string
  causeListDate: string
  caseNumber: string
  bench: string
  court: string
  judgeName: string
  hearingType: string
  lawyerName: string
  serialNumber: number
}

export const dashboardApi = {
  getSummary: (): Promise<ApiResponse<DashboardSummary>> => {
    return apiClient.get<ApiResponse<DashboardSummary>>('/api/v1/dashboard/summary')
  },

  getRecentActivity: (): Promise<ApiResponse<RecentActivityItem[]>> => {
    return apiClient.get<ApiResponse<RecentActivityItem[]>>('/api/v1/dashboard/recent-activity')
  },

  getActivityChart: (): Promise<ApiResponse<ChartData>> => {
    return apiClient.get<ApiResponse<ChartData>>('/api/v1/dashboard/recent-activity/chart')
  },

  getUpcomingHearings: (): Promise<ApiResponse<UpcomingHearing[]>> => {
    return apiClient.get<ApiResponse<UpcomingHearing[]>>('/api/v1/dashboard/upcoming-hearings')
  },
}

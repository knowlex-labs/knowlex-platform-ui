import { apiClient } from './api-client'
import type { ApiResponse } from '../types'

export interface DashboardSummary {
  totalCases: number
  activeCases: number
  totalClients: number
}

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

export interface RecentDocument {
  id: string
  name: string
  title: string | null
  originalFilename: string | null
  fileType: string | null
  type: string
  caseTitle: string | null
  caseId: string | null
  updatedAt: string
}

export interface RecentActivity {
  recentCases: RecentCase[]
  recentClients: RecentClient[]
  recentDocuments: RecentDocument[]
}

export interface UpcomingHearing {
  id: string
  caseNumber: string
  caseTitle: string
  nextHearingDate: string
  judgeName: string
  courtName: string
  courtLocation: string
  caseStatus: string
}

export const dashboardApi = {
  getSummary: (): Promise<ApiResponse<DashboardSummary>> => {
    return apiClient.get<ApiResponse<DashboardSummary>>('/api/v1/dashboard/summary')
  },

  getRecentActivity: (): Promise<ApiResponse<RecentActivity>> => {
    return apiClient.get<ApiResponse<RecentActivity>>('/api/v1/dashboard/recent-activity')
  },

  getUpcomingHearings: (): Promise<ApiResponse<UpcomingHearing[]>> => {
    return apiClient.get<ApiResponse<UpcomingHearing[]>>('/api/v1/dashboard/upcoming-hearings')
  },
}

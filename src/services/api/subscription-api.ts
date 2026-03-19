// Subscription & Wallet API services

import { apiClient } from './api-client'
import type {
  ApiResponse,
  PaginatedData,
  Plan,
  Subscription,
  SubscriptionUsage,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CancelSubscriptionRequest,
  WalletBalance,
  WalletTransaction,
  TopUpRequest,
  TopUpResponse,
  VerifyTopUpRequest,
} from '@/types'

const SUBSCRIPTION_ENDPOINT = '/api/v1/subscriptions'
const WALLET_ENDPOINT = '/api/v1/wallet'

export const subscriptionApi = {
  getPlans: (): Promise<ApiResponse<Plan[]>> => {
    return apiClient.get<ApiResponse<Plan[]>>(`${SUBSCRIPTION_ENDPOINT}/plans`)
  },

  createSubscription: (data: CreateSubscriptionRequest): Promise<ApiResponse<CreateSubscriptionResponse>> => {
    return apiClient.post<ApiResponse<CreateSubscriptionResponse>>(SUBSCRIPTION_ENDPOINT, data)
  },

  getCurrentSubscription: (): Promise<ApiResponse<Subscription>> => {
    return apiClient.get<ApiResponse<Subscription>>(`${SUBSCRIPTION_ENDPOINT}/current`)
  },

  getUsage: (): Promise<ApiResponse<SubscriptionUsage>> => {
    return apiClient.get<ApiResponse<SubscriptionUsage>>(`${SUBSCRIPTION_ENDPOINT}/usage`)
  },

  cancelSubscription: (data: CancelSubscriptionRequest = {}): Promise<ApiResponse<null>> => {
    return apiClient.post<ApiResponse<null>>(`${SUBSCRIPTION_ENDPOINT}/cancel`, data)
  },
}

export const walletApi = {
  getBalance: (): Promise<ApiResponse<WalletBalance>> => {
    return apiClient.get<ApiResponse<WalletBalance>>(`${WALLET_ENDPOINT}/balance`)
  },

  topUp: (data: TopUpRequest): Promise<ApiResponse<TopUpResponse>> => {
    return apiClient.post<ApiResponse<TopUpResponse>>(`${WALLET_ENDPOINT}/top-up`, data)
  },

  verifyTopUp: (data: VerifyTopUpRequest): Promise<ApiResponse<null>> => {
    return apiClient.post<ApiResponse<null>>(`${WALLET_ENDPOINT}/verify-top-up`, data)
  },

  getTransactions: (params: { page?: number; size?: number } = {}): Promise<ApiResponse<PaginatedData<WalletTransaction>>> => {
    const { page = 0, size = 20 } = params
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(size),
    })
    return apiClient.get<ApiResponse<PaginatedData<WalletTransaction>>>(
      `${WALLET_ENDPOINT}/transactions?${searchParams}`
    )
  },
}

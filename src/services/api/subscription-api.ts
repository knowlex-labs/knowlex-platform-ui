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
  PaymentRecord,
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

  getPayments: (): Promise<ApiResponse<PaymentRecord[]>> => {
    return apiClient.get<ApiResponse<PaymentRecord[]>>(`${SUBSCRIPTION_ENDPOINT}/payments`)
  },

  getInvoiceUrl: async (): Promise<string> => {
    const token = localStorage.getItem('auth_token')
    const userId = localStorage.getItem('auth_user_id')
    const headers: HeadersInit = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (userId) headers['x-user-id'] = userId

    // Backend returns 302 → Razorpay receipt page; fetch follows the redirect
    // and response.url is the final Razorpay URL
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${SUBSCRIPTION_ENDPOINT}/invoice`, { headers })
    if (!res.ok) throw new Error(`Failed to get invoice (${res.status})`)
    return res.url
  },
}

export const walletApi = {
  getBalance: (): Promise<ApiResponse<WalletBalance>> => {
    return apiClient.get<ApiResponse<WalletBalance>>(WALLET_ENDPOINT)
  },

  topUp: (data: TopUpRequest): Promise<ApiResponse<TopUpResponse>> => {
    return apiClient.post<ApiResponse<TopUpResponse>>(`${WALLET_ENDPOINT}/topup`, data)
  },

  verifyTopUp: (data: VerifyTopUpRequest): Promise<ApiResponse<null>> => {
    return apiClient.post<ApiResponse<null>>(`${WALLET_ENDPOINT}/topup/verify`, data)
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

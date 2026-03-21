// Subscription & Billing types

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PENDING'
  | 'CREATED'

export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type PlanType = 'FREE' | 'PRO' | 'PREMIUM'

export interface PlanFeatures {
  maxDrafts: number       // -1 = unlimited
  maxClients: number      // -1 = unlimited
  maxCases: number        // -1 = unlimited
  maxStorageMb: number    // -1 = unlimited
  payAsYouGoPrice: number // per-draft price when over limit
}

export interface Plan {
  id: string
  name: string
  type: PlanType
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: PlanFeatures
  isPopular?: boolean
}

export interface Subscription {
  id: string
  planId: string
  planName: string
  planDisplayName?: string
  planType: PlanType
  status: SubscriptionStatus
  billingCycle: BillingCycle
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndDate?: string
  cancelledAt?: string
  razorpaySubscriptionId?: string
  createdAt: string
  updatedAt: string
}

export interface SubscriptionUsage {
  draftsUsed: number
  draftsLimit: number       // -1 = unlimited
  clientsUsed: number
  clientsLimit: number      // -1 = unlimited
  casesUsed: number
  casesLimit: number        // -1 = unlimited
  storageMbUsed: number
  storageMbLimit: number    // -1 = unlimited
}

export interface PaymentRecord {
  id: string
  amount: number
  currency: string
  createdAt: string
  shortUrl?: string
}

export interface WalletBalance {
  balance: number
  currency: string
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT'

export interface WalletTransaction {
  id: string
  type: WalletTransactionType
  amount: number
  description: string
  balanceAfter: number
  createdAt: string
}

// API response types
export interface CreateSubscriptionRequest {
  planType: PlanType
  billingCycle: BillingCycle
}

export interface CreateSubscriptionResponse {
  subscriptionId: string
  razorpaySubscriptionId: string
  razorpayKeyId: string
  amount: number
  currency: string
}

export interface TopUpRequest {
  amount: number
}

export interface TopUpResponse {
  orderId: string
  razorpayKeyId: string
  amount: number
  currency: string
}

export interface VerifyTopUpRequest {
  orderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export interface CancelSubscriptionRequest {
  reason?: string
}

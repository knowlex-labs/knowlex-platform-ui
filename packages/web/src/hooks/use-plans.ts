import { useState, useEffect, useCallback } from 'react'
import { subscriptionApi } from '@knowlex/core/api/subscription-api'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { useAuth } from '@/contexts/auth-context'
import type { Plan, BillingCycle, PlanType } from '@knowlex/core/types'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 20

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { user } = useAuth()

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await subscriptionApi.getPlans()
      setPlans(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const pollForActivation = useCallback(async (): Promise<boolean> => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      try {
        const res = await subscriptionApi.getCurrentSubscription()
        const status = res.data.status
        if (status === 'ACTIVE' || status === 'TRIALING' || status === 'CREATED') {
          return true
        }
      } catch {
        // keep polling — do NOT let a failed request abort the poll
      }
    }
    return false
  }, [])

  const subscribe = useCallback(async (planType: PlanType, billingCycle: BillingCycle): Promise<boolean> => {
    try {
      setIsSubscribing(true)
      setError(null)

      const res = await subscriptionApi.createSubscription({ planType, billingCycle })
      const { razorpaySubscriptionId, razorpayKeyId, amount, currency } = res.data

      return new Promise<boolean>((resolve) => {
        openRazorpayCheckout({
          key: razorpayKeyId,
          amount,
          currency,
          subscription_id: razorpaySubscriptionId,
          name: 'Knowlex AI',
          description: `${planType} Plan - ${billingCycle.toLowerCase()}`,
          prefill: {
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
            email: user?.email,
          },
          theme: { color: '#4F46E5' },
          handler: async () => {
            // Payment captured — poll until backend activates (ACTIVE/TRIALING/CREATED)
            await pollForActivation()
            setIsSubscribing(false)
            // Resolve true regardless: payment went through, caller should refresh
            resolve(true)
          },
          modal: {
            ondismiss: () => {
              setIsSubscribing(false)
              resolve(false)
            },
          },
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription')
      setIsSubscribing(false)
      return false
    }
  }, [user, pollForActivation])

  return {
    plans,
    isLoading,
    error,
    isSubscribing,
    refresh: fetchPlans,
    subscribe,
  }
}

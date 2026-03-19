import { useState, useEffect, useCallback } from 'react'
import { subscriptionApi } from '@/services/api/subscription-api'
import type { Subscription, SubscriptionUsage, CancelSubscriptionRequest } from '@/types'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [subRes, usageRes] = await Promise.all([
        subscriptionApi.getCurrentSubscription(),
        subscriptionApi.getUsage(),
      ])
      setSubscription(subRes.data)
      setUsage(usageRes.data)
    } catch (err) {
      // No subscription is a valid state, not an error for display
      setSubscription(null)
      setUsage(null)
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const cancelSubscription = useCallback(async (data: CancelSubscriptionRequest = {}) => {
    await subscriptionApi.cancelSubscription(data)
    await fetchSubscription()
  }, [fetchSubscription])

  return {
    subscription,
    usage,
    isLoading,
    error,
    refresh: fetchSubscription,
    cancelSubscription,
  }
}

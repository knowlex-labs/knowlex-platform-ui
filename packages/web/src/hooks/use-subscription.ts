import { useState, useEffect, useCallback } from 'react'
import { subscriptionApi } from '@knowlex/core/api/subscription-api'
import type { Subscription, SubscriptionUsage, CancelSubscriptionRequest } from '@knowlex/core/types'

const AUTH_TOKEN_KEY = 'auth_token'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const subRes = await subscriptionApi.getCurrentSubscription()
      const raw = subRes.data as Subscription & { usage?: SubscriptionUsage }
      setSubscription(raw)
      // Usage is embedded in the subscription response — no separate API call needed
      setUsage(raw.usage ?? null)
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

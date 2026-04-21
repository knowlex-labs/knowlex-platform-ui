import * as React from 'react'
import { subscriptionApi } from '@knowlex/core/api/subscription-api'
import type { FeatureName, SubscriptionPreferences } from '@knowlex/core/types'
import { useAuth } from './auth-context'

interface SubscriptionPreferencesContextValue {
  preferences: SubscriptionPreferences | null
  isLoading: boolean
  isLocked: (feature: FeatureName) => boolean
  refresh: () => void
}

const SubscriptionPreferencesContext = React.createContext<SubscriptionPreferencesContextValue | undefined>(undefined)

export function SubscriptionPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const [preferences, setPreferences] = React.useState<SubscriptionPreferences | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchPreferences = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await subscriptionApi.getPreferences()
      if (res.status === 'success' && res.data) {
        setPreferences(res.data)
      }
    } catch {
      // silently fail — features default to unlocked if fetch fails
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (isRestoringSession) return
    if (isAuthenticated) {
      fetchPreferences()
    } else {
      setPreferences(null)
    }
  }, [isAuthenticated, isRestoringSession, fetchPreferences])

  const isLocked = React.useCallback(
    (feature: FeatureName): boolean => {
      if (!preferences) return false
      const found = preferences.features.find((f) => f.name === feature)
      return found?.status === 'LOCKED'
    },
    [preferences]
  )

  return (
    <SubscriptionPreferencesContext.Provider
      value={{ preferences, isLoading, isLocked, refresh: fetchPreferences }}
    >
      {children}
    </SubscriptionPreferencesContext.Provider>
  )
}

export function useSubscriptionPreferences() {
  const ctx = React.useContext(SubscriptionPreferencesContext)
  if (!ctx) throw new Error('useSubscriptionPreferences must be used within SubscriptionPreferencesProvider')
  return ctx
}

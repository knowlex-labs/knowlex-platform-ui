import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/hooks/use-subscription'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export function ProtectedLayout() {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const { subscription, isLoading: isLoadingSubscription } = useSubscription()
  const location = useLocation()
  const navigate = useNavigate()
  const [subscriptionRequired, setSubscriptionRequired] = useState(false)

  // Listen for subscription:required events and redirect to pricing
  useEffect(() => {
    const handler = () => {
      setSubscriptionRequired(true)
    }
    window.addEventListener('subscription:required', handler)
    return () => window.removeEventListener('subscription:required', handler)
  }, [])

  if (isRestoringSession || (isAuthenticated && isLoadingSubscription)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kx-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600 mx-auto mb-4"></div>
          <p className="text-ledger-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const hasActiveSubscription =
    subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'

  if (!hasActiveSubscription || subscriptionRequired) {
    return <Navigate to="/" replace />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

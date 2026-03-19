import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export function ProtectedLayout() {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Listen for subscription:required events and redirect to plans page
  useEffect(() => {
    const handler = () => {
      navigate('/plans', { state: { from: location }, replace: true })
    }
    window.addEventListener('subscription:required', handler)
    return () => window.removeEventListener('subscription:required', handler)
  }, [navigate, location])

  if (isRestoringSession) {
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

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

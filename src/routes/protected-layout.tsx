import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export function ProtectedLayout() {
  const { isAuthenticated, isRestoringSession } = useAuth()
  const location = useLocation()

  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ledger-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger-black mx-auto mb-4"></div>
          <p className="text-ledger-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

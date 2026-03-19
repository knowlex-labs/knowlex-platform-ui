import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/admin-auth-context'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function AdminLayout() {
  const { adminUser, isAdminAuthenticated, isRestoringSession, adminLogout } = useAdminAuth()
  const location = useLocation()

  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kx-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600 mx-auto mb-4" />
          <p className="text-kx-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return (
    <div className="min-h-screen bg-ledger-50 dark:bg-ledger-950">
      <header className="border-b border-ledger-200 dark:border-ledger-800 bg-white dark:bg-ledger-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-7 w-auto dark:invert" />
            <span className="text-lg font-serif font-bold text-kx-text-primary tracking-tight">Knowlex</span>
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-kx-primary-100 dark:bg-kx-primary-900 text-kx-primary-700 dark:text-kx-primary-300 rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            {adminUser && (
              <span className="text-sm text-kx-text-secondary">
                {adminUser.firstName} {adminUser.lastName}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={adminLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

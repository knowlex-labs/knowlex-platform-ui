import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdminAuth } from '@/contexts/admin-auth-context'
import { AlertCircle } from 'lucide-react'

export function AdminLoginPage() {
  const { adminLogin, isAdminAuthenticated, isRestoringSession } = useAdminAuth()
  const navigate = useNavigate()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (isAdminAuthenticated && !isRestoringSession) {
      navigate('/admin', { replace: true })
    }
  }, [isAdminAuthenticated, isRestoringSession, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await adminLogin(username, password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials or not an admin')
    } finally {
      setIsLoading(false)
    }
  }

  if (isRestoringSession) {
    return (
      <div className="force-light min-h-screen flex items-center justify-center bg-ledger-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600 mx-auto mb-4" />
          <p className="text-kx-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="force-light min-h-screen flex items-center justify-center bg-ledger-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-8 w-auto" />
            <span className="text-xl font-serif font-bold text-kx-text-primary tracking-tight">Knowlex</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-kx-text-primary">Admin Login</h1>
          <p className="text-sm text-kx-text-secondary mt-1">Sign in to the admin dashboard</p>
        </div>

        <div className="rounded-xl border border-ledger-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-kx-primary-600 hover:bg-kx-primary-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@knowlex/core/api/auth-api'
import { AuthLayout } from './auth-layout'

type Stage = 'validating' | 'invalid' | 'ready' | 'submitting' | 'done' | 'error'

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (pw.length > 128) return 'Password must be 128 characters or fewer.'
  if (!/[A-Za-z]/.test(pw)) return 'Password must include a letter.'
  if (!/\d/.test(pw)) return 'Password must include a digit.'
  return null
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [stage, setStage] = React.useState<Stage>('validating')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string>('')

  React.useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true })
      return
    }
    let cancelled = false
    authApi.validateResetToken(token).then((res) => {
      if (cancelled) return
      setStage(res.valid ? 'ready' : 'invalid')
    })
    return () => { cancelled = true }
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    const policyError = validatePassword(password)
    if (policyError) {
      setErrorMessage(policyError)
      return
    }
    if (password !== confirm) {
      setErrorMessage('Passwords do not match.')
      return
    }
    setErrorMessage('')
    setStage('submitting')
    try {
      await authApi.resetPassword(token, password)
      setStage('done')
      setTimeout(() => navigate('/login?passwordReset=1', { replace: true }), 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message
      setErrorMessage(message || 'Password reset failed. Please try again.')
      setStage('error')
    }
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-serif font-semibold text-kx-text-primary mb-1">
          Set a new password
        </h2>
        <p className="text-sm text-kx-text-secondary mb-6">
          Choose a strong password with at least one letter and one digit.
        </p>

        {stage === 'validating' && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600" />
          </div>
        )}

        {stage === 'invalid' && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">This link is invalid or has expired</p>
                <p className="mt-1 text-red-800">Request a new reset link to continue.</p>
              </div>
            </div>
            <Link to="/forgot-password">
              <Button className="w-full">Request a new reset link</Button>
            </Link>
          </div>
        )}

        {stage === 'done' && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-900 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Password updated</p>
              <p className="mt-1 text-green-800">Redirecting you to sign in…</p>
            </div>
          </div>
        )}

        {(stage === 'ready' || stage === 'submitting' || stage === 'error') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kx-text-secondary" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kx-text-secondary" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={stage === 'submitting' || !password || !confirm}
              className="w-full"
            >
              {stage === 'submitting' ? 'Updating…' : 'Update password'}
            </Button>

            <div className="text-center text-sm">
              <Link
                to="/login"
                className="text-kx-text-secondary hover:text-kx-text-primary inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}

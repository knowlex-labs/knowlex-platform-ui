import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@knowlex/core/api/auth-api'
import { useAuth } from '@/contexts/auth-context'
import { AuthLayout } from './auth-layout'

type Stage = 'verifying' | 'success' | 'failed'

const RESEND_COOLDOWN_SECONDS = 60

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const { isAuthenticated, user, refreshUser } = useAuth()

  const [stage, setStage] = React.useState<Stage>('verifying')
  const [resendEmail, setResendEmail] = React.useState(user?.email ?? '')
  const [resendSent, setResendSent] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  React.useEffect(() => {
    if (!token) {
      setStage('failed')
      return
    }
    let cancelled = false
    authApi.verifyEmail(token)
      .then((res) => {
        if (cancelled) return
        refreshUser(res.user)
        setStage('success')
        setTimeout(() => {
          if (cancelled) return
          navigate(isAuthenticated ? '/home' : '/login', { replace: true })
        }, 2000)
      })
      .catch(() => {
        if (cancelled) return
        setStage('failed')
      })
    return () => { cancelled = true }
  }, [token, navigate, isAuthenticated, refreshUser])

  const handleResend = async () => {
    if (!resendEmail.trim() || cooldown > 0) return
    await authApi.resendVerification(resendEmail.trim())
    setResendSent(true)
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-serif font-semibold text-kx-text-primary mb-1">
          Email verification
        </h2>
        <p className="text-sm text-kx-text-secondary mb-6">
          Confirming your email address with Knowlex.
        </p>

        {stage === 'verifying' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600" />
            <p className="text-sm text-kx-text-secondary">Verifying…</p>
          </div>
        )}

        {stage === 'success' && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-900 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Email verified</p>
                <p className="mt-1 text-green-800">
                  Thanks for confirming. Redirecting you now…
                </p>
              </div>
            </div>
          </div>
        )}

        {stage === 'failed' && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Link invalid or expired</p>
                <p className="mt-1 text-red-800">
                  This verification link can&apos;t be used. Request a fresh one below.
                </p>
              </div>
            </div>

            {resendSent ? (
              <div className="flex items-start gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-900 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>If your email is unverified, a new link has been sent.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="resend-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kx-text-secondary" />
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleResend}
              disabled={!resendEmail.trim() || cooldown > 0}
              className="w-full"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : resendSent ? 'Send again' : 'Resend verification email'}
            </Button>

            <Link to={isAuthenticated ? '/home' : '/login'} className="block text-center text-sm text-kx-text-secondary hover:text-kx-text-primary">
              {isAuthenticated ? 'Continue to dashboard' : 'Back to sign in'}
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

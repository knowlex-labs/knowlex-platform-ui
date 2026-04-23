import * as React from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@knowlex/core/api/auth-api'
import { AuthLayout } from './auth-layout'

const RESEND_COOLDOWN_SECONDS = 60

export function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || cooldown > 0) return
    setIsSubmitting(true)
    await authApi.forgotPassword(email.trim())
    setIsSubmitting(false)
    setIsSubmitted(true)
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-serif font-semibold text-kx-text-primary mb-1">
          Forgot your password?
        </h2>
        <p className="text-sm text-kx-text-secondary mb-6">
          Enter the email you used to sign up. We&apos;ll send a reset link.
        </p>

        {isSubmitted ? (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-900 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Check your inbox</p>
                <p className="mt-1 text-green-800">
                  If an account exists for <strong>{email}</strong>, a reset link has been sent.
                  It expires in 30 minutes.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={cooldown > 0 || isSubmitting}
              variant="outline"
              className="w-full"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
            </Button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-kx-text-secondary hover:text-kx-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kx-text-secondary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || !email.trim()} className="w-full">
              {isSubmitting ? 'Sending…' : 'Send reset link'}
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

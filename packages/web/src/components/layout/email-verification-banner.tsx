import * as React from 'react'
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react'
import { authApi } from '@knowlex/core/api/auth-api'
import { userApi } from '@knowlex/core/api/user-api'
import { useAuth } from '@/contexts/auth-context'

const RESEND_COOLDOWN_SECONDS = 60

export function EmailVerificationBanner() {
  const { user, refreshUser } = useAuth()
  const [cooldown, setCooldown] = React.useState(0)
  const [justSent, setJustSent] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  if (!user || user.emailVerified !== false) return null

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return
    setIsResending(true)
    try {
      await authApi.resendVerification(user.email)
      setJustSent(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setTimeout(() => setJustSent(false), 4000)
    } finally {
      setIsResending(false)
    }
  }

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const res = await userApi.getCurrentUser()
      if (res.status === 'success' && res.data) {
        refreshUser({
          emailVerified: res.data.emailVerified,
          emailVerifiedAt: res.data.emailVerifiedAt
            ? new Date(res.data.emailVerifiedAt)
            : undefined,
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {justSent ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-700" />
          ) : (
            <Mail className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="truncate">
            {justSent
              ? 'Verification email sent. Check your inbox.'
              : <>Please verify <strong>{user.email}</strong> to secure your account.</>}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="text-xs font-medium underline underline-offset-2 hover:text-amber-950 disabled:opacity-50 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
          </button>
          <span className="text-amber-400">·</span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-medium underline underline-offset-2 hover:text-amber-950 disabled:opacity-50 inline-flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            I&apos;ve verified
          </button>
        </div>
      </div>
    </div>
  )
}

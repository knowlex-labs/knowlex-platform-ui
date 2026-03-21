import * as React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { AuthLayout } from './auth-layout'
import { AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
        }
      }
    }
  }
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { login, googleLogin, isAuthenticated, isRestoringSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleButtonRef = React.useRef<HTMLDivElement>(null)
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = React.useState(false)

  const sessionExpired = location.state?.sessionExpired === true

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isRestoringSession) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, isRestoringSession, navigate])

  const handleGoogleCallback = React.useCallback(async (response: { credential: string }) => {
    setError('')
    try {
      await googleLogin(response.credential)
      navigate('/home', { replace: true })
    } catch (err) {
      console.error('Google login failed:', err)
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
    }
  }, [googleLogin, navigate])

  // Load Google Sign-In script
  React.useEffect(() => {
    if (!googleClientId) return

    if (window.google?.accounts?.id) {
      setIsGoogleScriptLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleScriptLoaded(true))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setIsGoogleScriptLoaded(true)
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script')
    }
    document.head.appendChild(script)
  }, [googleClientId])

  // Initialize Google Sign-In and render button
  React.useEffect(() => {
    if (!isGoogleScriptLoaded || !googleClientId || !googleButtonRef.current || !window.google?.accounts?.id) {
      return
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      if (googleButtonRef.current && !googleButtonRef.current.hasChildNodes()) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        })

        setTimeout(() => {
          if (googleButtonRef.current) {
            const iframe = googleButtonRef.current.querySelector('iframe')
            if (iframe) {
              iframe.style.width = '100%'
              iframe.style.minWidth = '100%'
            }
            const div = googleButtonRef.current.querySelector('div')
            if (div) {
              div.style.width = '100%'
            }
          }
        }, 100)
      }
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err)
    }
  }, [isGoogleScriptLoaded, googleClientId, handleGoogleCallback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login({ username, password })
      navigate('/home')
    } catch (err) {
      console.error('Login failed:', err)
      setError(err instanceof Error ? err.message : 'Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ledger-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600 mx-auto mb-4" />
          <p className="text-kx-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-serif font-semibold text-kx-text-primary mb-1">Sign In</h2>
        <p className="text-sm text-kx-text-secondary mb-6">
          Enter your credentials to access Knowlex
        </p>

        {sessionExpired && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Session Expired</p>
              <p className="mt-1 text-red-800">Your session has expired. Please log in again to continue.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder=""
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-kx-primary-600 hover:bg-kx-primary-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {googleClientId && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-ledger-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-ledger-white px-2 text-ledger-gray-400">or</span>
              </div>
            </div>
            <div className="w-full">
              {isGoogleScriptLoaded ? (
                <div
                  ref={googleButtonRef}
                  className="w-full [&>div]:w-full [&>div>iframe]:w-full [&>div>iframe]:!min-w-full"
                  style={{ minHeight: '40px' }}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <GoogleIcon />
                  <span className="ml-2">Loading Google Sign-In...</span>
                </Button>
              )}
            </div>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-kx-text-secondary">Don't have an account? </span>
          <Link to="/signup" className="text-kx-primary-600 font-medium hover:text-kx-primary-700 underline underline-offset-2">
            Sign up for free
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

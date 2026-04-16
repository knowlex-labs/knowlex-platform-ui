import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { AuthLayout } from './auth-layout'
import { STATE_BENCH_MAP, STATES } from '@/lib/courts'

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

export function SignupPage() {
  const { signup, googleLogin, isAuthenticated, isRestoringSession } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    state: '',
    bench: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleButtonRef = React.useRef<HTMLDivElement>(null)
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = React.useState(false)

  const isEmailValid = formData.email.includes('@') && formData.email.includes('.')
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  const passwordsEntered = formData.password && formData.confirmPassword
  const passwordsDontMatch = Boolean(passwordsEntered && formData.password !== formData.confirmPassword)

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isRestoringSession) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isRestoringSession])

  const handleGoogleCallback = React.useCallback(async (response: { credential: string }) => {
    setError('')
    try {
      await googleLogin(response.credential)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Google signup failed:', err)
      setError(err instanceof Error ? err.message : 'Google sign-up failed. Please try again.')
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
      setError('Failed to load Google Sign-In. Please check your internet connection.')
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
          text: 'signup_with',
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
      setError('Failed to initialize Google Sign-In. Please try again.')
    }
  }, [isGoogleScriptLoaded, googleClientId, handleGoogleCallback])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'state') {
      setFormData((prev) => ({ ...prev, state: value, bench: '' }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEmailValid) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await signup({ ...formData, city: formData.bench })
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Signup failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.')
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
        <h2 className="text-2xl font-serif font-semibold text-kx-text-primary mb-1">Create Account</h2>
        <p className="text-sm text-kx-text-secondary mb-6">
          Join Knowlex to streamline your legal workflow
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder=""
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder=""
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="signupEmail">Email</Label>
            <div className="relative">
              <Input
                id="signupEmail"
                name="email"
                type="email"
                placeholder=""
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={formData.email && !isEmailValid ? 'border-red-300 focus:border-red-500' : ''}
              />
              {formData.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isEmailValid ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {formData.email && !isEmailValid && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid email</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder=""
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <Select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                searchable
                searchPlaceholder="Search state..."
              >
                <option value="">Select state</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bench">Bench</Label>
              <Select
                id="bench"
                name="bench"
                value={formData.bench}
                onChange={handleChange}
                disabled={!formData.state}
              >
                <option value="">Select bench</option>
                {(STATE_BENCH_MAP[formData.state] || []).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="signupPassword">Password</Label>
              <Input
                id="signupPassword"
                name="password"
                type="password"
                placeholder=""
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder=""
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className={passwordsDontMatch ? 'border-red-300 focus:border-red-500' : ''}
                />
                {passwordsEntered && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {passwordsDontMatch && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-kx-primary-600 hover:bg-kx-primary-700 text-white"
            disabled={isLoading || !isEmailValid || !!passwordsDontMatch}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {googleClientId && (
            <>
              <div className="relative my-2">
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
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-kx-text-secondary">Already have an account? </span>
          <Link
            to="/login"
            className="text-kx-primary-600 font-medium hover:text-kx-primary-700 underline underline-offset-2"
          >
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

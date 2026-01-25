import * as React from 'react'
import { Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useNavigation } from '@/contexts/navigation-context'

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { 
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (notification?: (notification: { isNotDisplayed: boolean; isSkippedMoment: boolean; isDismissedMoment: boolean }) => void) => void
          renderButton: (element: HTMLElement, options?: {
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            logo_alignment?: 'left' | 'center'
            width?: string
            locale?: string
          }) => void
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

export function SignupModal({ open, onOpenChange, onSwitchToLogin }: SignupModalProps) {
  const { signup, googleLogin } = useAuth()
  const { setView } = useNavigation()
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleButtonRef = React.useRef<HTMLDivElement>(null)
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = React.useState(false)

  // Validation states
  const isEmailValid = formData.email.includes('@') && formData.email.includes('.')
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  const passwordsEntered = formData.password && formData.confirmPassword
  const passwordsDontMatch = Boolean(passwordsEntered && formData.password !== formData.confirmPassword)

  const handleGoogleCallback = React.useCallback(async (response: { credential: string }) => {
    setError('')

    try {
      await googleLogin(response.credential)
      setView('dashboard')
      onOpenChange(false)
    } catch (err) {
      console.error('Google signup failed:', err)
      setError(err instanceof Error ? err.message : 'Google sign-up failed. Please try again.')
    }
  }, [googleLogin, setView, onOpenChange])

  // Load Google Sign-In script
  React.useEffect(() => {
    if (!open || !googleClientId) return

    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      setIsGoogleScriptLoaded(true)
      return
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      // Wait for script to load
      existingScript.addEventListener('load', () => {
        setIsGoogleScriptLoaded(true)
      })
      return
    }

    // Create and load script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsGoogleScriptLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script')
      setError('Failed to load Google Sign-In. Please check your internet connection.')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup: don't remove script as it might be used elsewhere
    }
  }, [open, googleClientId])

  // Initialize Google Sign-In and render button
  React.useEffect(() => {
    if (!isGoogleScriptLoaded || !googleClientId || !googleButtonRef.current || !window.google?.accounts?.id) {
      return
    }

    // Listen for Google Sign-In errors
    const handleGoogleError = () => {
      const currentOrigin = window.location.origin
      setError(
        `Google Sign-In configuration error: The origin "${currentOrigin}" is not authorized. ` +
        `Please add "${currentOrigin}" to Authorized JavaScript origins in Google Cloud Console. ` +
        `Go to: APIs & Services > Credentials > Your OAuth Client > Authorized JavaScript origins`
      )
    }

    // Monitor for iframe load errors
    const checkForErrors = () => {
      setTimeout(() => {
        if (googleButtonRef.current) {
          const iframe = googleButtonRef.current.querySelector('iframe')
          if (iframe) {
            iframe.onerror = handleGoogleError
            // Check if iframe failed to load (403 error)
            iframe.onload = () => {
              try {
                // Try to access iframe content - if it fails, it's likely a CORS/403 error
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                if (!iframeDoc) {
                  // This might indicate a CORS issue
                  console.warn('Google Sign-In iframe may have CORS restrictions')
                }
              } catch (e) {
                // Expected - cross-origin iframe access is restricted
              }
            }
          }
        }
      }, 500)
    }

    try {
      // Log the origin that needs to be authorized (for debugging)
      const currentOrigin = window.location.origin
      console.log('🔧 Google Sign-In Setup: Add this origin to Google Cloud Console:')
      console.log(`   ${currentOrigin}`)
      console.log('   Go to: APIs & Services > Credentials > OAuth 2.0 Client ID > Authorized JavaScript origins')

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Render button
      if (googleButtonRef.current && !googleButtonRef.current.hasChildNodes()) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        })
        
        checkForErrors()
        
        // Ensure the button iframe is full width after rendering
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
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Google Sign-In'
      const currentOrigin = window.location.origin
      if (errorMessage.includes('origin') || errorMessage.includes('client ID')) {
        setError(
          `Google Sign-In error: "${currentOrigin}" is not authorized. ` +
          `Add "${currentOrigin}" to Authorized JavaScript origins in Google Cloud Console.`
        )
      } else {
        setError('Failed to initialize Google Sign-In. Please try again.')
      }
    }

    // Listen to console errors for Google Sign-In
    const originalError = console.error
    const errorListener = (message: any, ...args: any[]) => {
      if (typeof message === 'string' && message.includes('origin') && message.includes('client ID')) {
        const currentOrigin = window.location.origin
        setError(
          `Google Sign-In: "${currentOrigin}" is not authorized. ` +
          `Add it to Authorized JavaScript origins in Google Cloud Console.`
        )
      }
      originalError(message, ...args)
    }
    console.error = errorListener

    return () => {
      console.error = originalError
    }
  }, [isGoogleScriptLoaded, googleClientId, handleGoogleCallback])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      await signup(formData)
      setView('dashboard')
      onOpenChange(false)
    } catch (err) {
      console.error('Signup failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Join Knowlex AI to streamline your legal workflow
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Rajesh"
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
                placeholder="Sharma"
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
                placeholder="advocate@lawfirm.com"
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
              placeholder="advocate.sharma"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="signupPassword">Password</Label>
              <Input
                id="signupPassword"
                name="password"
                type="password"
                placeholder="Create password"
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
                  placeholder="Confirm password"
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
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !isEmailValid || !!passwordsDontMatch}>
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
                    disabled={true}
                  >
                    <GoogleIcon />
                    <span className="ml-2">Loading Google Sign-In...</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </form>

        <div className="mt-3 text-center text-sm">
          <span className="text-ledger-gray-500">Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-ledger-black underline underline-offset-2 hover:text-ledger-gray-700"
          >
            Sign In
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

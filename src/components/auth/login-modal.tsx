import * as React from 'react'
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

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignup: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement, config: { theme: string; size: string; width: number }) => void
        }
      }
    }
  }
}

export function LoginModal({ open, onOpenChange, onSwitchToSignup }: LoginModalProps) {
  const { login, googleLogin, continueAsGuest } = useAuth()
  const { setView } = useNavigation()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const googleButtonRef = React.useRef<HTMLDivElement>(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  React.useEffect(() => {
    if (!open || !googleClientId || !googleButtonRef.current) return

    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        })
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 400,
        })
      }
    }

    if (window.google) {
      initializeGoogle()
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogle
      document.body.appendChild(script)
    }
  }, [open, googleClientId])

  const handleGoogleResponse = async (response: { credential: string }) => {
    setIsLoading(true)
    setError('')

    try {
      await googleLogin(response.credential)
      setView('dashboard')
      onOpenChange(false)
    } catch (err) {
      console.error('Google login failed:', err)
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login({ username, password })
      setView('dashboard')
      onOpenChange(false)
    } catch (err) {
      console.error('Login failed:', err)
      setError(err instanceof Error ? err.message : 'Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Enter your credentials to access Knowlex AI
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="advocate.sharma"
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-ledger-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-ledger-white px-2 text-ledger-gray-400">or</span>
            </div>
          </div>

          {googleClientId && (
            <div ref={googleButtonRef} className="flex justify-center" />
          )}

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              continueAsGuest()
              setView('dashboard')
              onOpenChange(false)
            }}
          >
            Continue as Guest
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-ledger-gray-500">Don't have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-ledger-black underline underline-offset-2 hover:text-ledger-gray-700"
          >
            Create Account
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

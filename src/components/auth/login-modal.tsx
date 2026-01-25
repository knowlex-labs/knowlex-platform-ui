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

export function LoginModal({ open, onOpenChange, onSwitchToSignup }: LoginModalProps) {
  const { login, continueAsGuest } = useAuth()
  const { setView } = useNavigation()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login({ email, password })
      setView('dashboard')
      onOpenChange(false)
    } catch (error) {
      console.error('Login failed:', error)
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="advocate@lawfirm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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

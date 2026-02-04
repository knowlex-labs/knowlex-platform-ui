import * as React from 'react'
import { Button } from '@/components/ui/button'
import { authApi } from '@/services/api/auth-api'

export function CTASection() {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      await authApi.register({
        username: email,
        email,
        password: crypto.randomUUID(),
      })
      setStatus('success')
      setEmail('')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-3 sm:mb-4">
            Join the Waitlist
          </h2>
          <p className="text-base sm:text-lg text-gray-500 mb-6 sm:mb-8">
            Be among the first to experience Knowlex. Get early access and 1 month free.
          </p>

          {status === 'success' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 text-emerald-700">
              You're on the list! We'll be in touch soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={status === 'loading'}
                  className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-6 font-medium transition-all"
                >
                  {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
                </Button>
              </div>
              {status === 'error' && (
                <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

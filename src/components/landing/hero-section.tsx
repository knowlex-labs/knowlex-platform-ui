import * as React from 'react'
import { Button } from '@/components/ui/button'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const floatingSymbols = [
  // Scales of justice
  { symbol: '\u2696', left: '3%', top: '12%', size: '56px', opacity: 0.08, duration: 18, delay: 0 },
  { symbol: '\u2696', left: '82%', top: '18%', size: '72px', opacity: 0.06, duration: 20, delay: 1 },
  { symbol: '\u2696', left: '48%', top: '8%', size: '48px', opacity: 0.07, duration: 19, delay: 7 },
  { symbol: '\u2696', left: '12%', top: '42%', size: '40px', opacity: 0.06, duration: 25, delay: 10 },
  { symbol: '\u2696', left: '92%', top: '55%', size: '60px', opacity: 0.05, duration: 22, delay: 3.5 },
  // Section signs
  { symbol: '\u00A7', left: '18%', top: '65%', size: '44px', opacity: 0.09, duration: 22, delay: 3 },
  { symbol: '\u00A7', left: '88%', top: '72%', size: '50px', opacity: 0.08, duration: 16, delay: 5 },
  { symbol: '\u00A7', left: '68%', top: '40%', size: '64px', opacity: 0.06, duration: 21, delay: 4 },
  { symbol: '\u00A7', left: '38%', top: '28%', size: '36px', opacity: 0.09, duration: 23, delay: 8 },
  { symbol: '\u00A7', left: '78%', top: '4%', size: '42px', opacity: 0.07, duration: 18, delay: 11 },
  // Scroll / document
  { symbol: '\uD83D\uDCDC', left: '28%', top: '82%', size: '38px', opacity: 0.07, duration: 24, delay: 2 },
  { symbol: '\uD83D\uDCDC', left: '58%', top: '88%', size: '44px', opacity: 0.06, duration: 17, delay: 6 },
  { symbol: '\uD83D\uDCDC', left: '42%', top: '52%', size: '32px', opacity: 0.08, duration: 20, delay: 9 },
  // Gavel
  { symbol: '\uD83D\uDD28', left: '6%', top: '78%', size: '46px', opacity: 0.07, duration: 21, delay: 4.5 },
  { symbol: '\uD83D\uDD28', left: '72%', top: '82%', size: '38px', opacity: 0.06, duration: 19, delay: 12 },
  { symbol: '\uD83D\uDD28', left: '52%', top: '22%', size: '34px', opacity: 0.05, duration: 23, delay: 1.5 },
]

export function HeroSection() {
  const [showForm, setShowForm] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !companyName.trim()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firmName: companyName }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to join waitlist')
      }

      setStatus('success')
      setEmail('')
      setCompanyName('')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Light gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-50/30 via-transparent to-transparent" />

      {/* Floating legal symbols */}
      {floatingSymbols.map((s, i) => (
        <span
          key={i}
          className="absolute pointer-events-none select-none text-gray-400"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.size,
            opacity: s.opacity,
            animation: `float-drift ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        >
          {s.symbol}
        </span>
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center">
        {/* Hero heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          Your Smart Legal Assistant
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-10 sm:mb-14 max-w-3xl mx-auto">
          AI-powered drafting assistant built for Indian law firms.
        </p>

        {/* Waitlist */}
        {status === 'success' ? (
          <div className="max-w-md mx-auto">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5 text-emerald-700 text-lg">
              You're on the list! We'll be in touch soon.
            </div>
          </div>
        ) : !showForm ? (
          <div className="flex flex-col items-center gap-4">
            <Button
              type="button"
              size="lg"
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-2xl px-14 py-6 text-xl font-medium transition-all shadow-lg hover:shadow-xl"
            >
              Join the Waitlist
            </Button>
            <p className="text-base sm:text-lg text-gray-500">
              Get early access and <span className="text-indigo-600 font-semibold">1 month free</span> when we launch.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white border border-gray-300 text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            <input
              type="text"
              required
              placeholder="Firm Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white border border-gray-300 text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            <Button
              type="submit"
              size="lg"
              disabled={status === 'loading'}
              className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-2xl px-10 py-6 text-xl font-medium transition-all shadow-lg hover:shadow-xl"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit'}
            </Button>
            {status === 'error' && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </form>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float-drift {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(3deg); }
          50% { transform: translateY(-35px) translateX(-8px) rotate(-2deg); }
          75% { transform: translateY(-15px) translateX(12px) rotate(1deg); }
        }
      `}</style>
    </section>
  )
}

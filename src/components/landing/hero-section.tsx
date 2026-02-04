import * as React from 'react'
import { Button } from '@/components/ui/button'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Floating legal symbols configuration
const floatingSymbols = [
  { symbol: '⚖', size: 48, left: '8%', top: '15%', opacity: 0.15, delay: 0, duration: 25 },
  { symbol: '§', size: 36, left: '85%', top: '20%', opacity: 0.12, delay: 2, duration: 22 },
  { symbol: '⚖', size: 32, left: '72%', top: '65%', opacity: 0.18, delay: 4, duration: 28 },
  { symbol: '§', size: 44, left: '15%', top: '70%', opacity: 0.14, delay: 1, duration: 24 },
  { symbol: '📜', size: 28, left: '25%', top: '25%', opacity: 0.12, delay: 3, duration: 26 },
  { symbol: '⚖', size: 56, left: '90%', top: '45%', opacity: 0.10, delay: 5, duration: 30 },
  { symbol: '§', size: 40, left: '5%', top: '50%', opacity: 0.15, delay: 2.5, duration: 23 },
  { symbol: '📜', size: 34, left: '60%', top: '12%', opacity: 0.12, delay: 1.5, duration: 27 },
  { symbol: '⚖', size: 24, left: '45%', top: '80%', opacity: 0.18, delay: 4.5, duration: 21 },
  { symbol: '§', size: 52, left: '78%', top: '35%', opacity: 0.10, delay: 3.5, duration: 29 },
  { symbol: '📜', size: 30, left: '35%', top: '55%', opacity: 0.14, delay: 0.5, duration: 25 },
  { symbol: '⚖', size: 38, left: '55%', top: '40%', opacity: 0.12, delay: 6, duration: 24 },
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url(/bg_image.png)',
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
        }}
      />

      {/* Floating legal symbols */}
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
        {floatingSymbols.map((item, index) => (
          <span
            key={index}
            className="absolute text-gray-900 font-bold select-none floating-symbol"
            style={{
              left: item.left,
              top: item.top,
              fontSize: `${item.size}px`,
              opacity: item.opacity,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
            }}
          >
            {item.symbol}
          </span>
        ))}
      </div>

      {/* Overlay handled globally by LandingPage (z-20) */}

      <div className="relative z-20 max-w-2xl mx-auto px-4 md:px-8 text-center pt-20">
        {/* Hero heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight animate-fade-in drop-shadow-lg whitespace-nowrap">
          Your Smart Legal Partner
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-gray-900 mb-10 sm:mb-14 max-w-md mx-auto animate-fade-in-delay drop-shadow-md">
          AI-powered drafting & research assistant for Indian law firms.
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
              className="bg-amber-600 text-white hover:bg-amber-700 rounded-2xl px-14 py-6 text-xl font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Join the Waitlist
            </Button>
            <p className="text-base sm:text-lg text-gray-900">
              Get early access and <span className="text-gray-900 font-bold">1 month free</span> when we launch.
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
              className="w-full bg-amber-600 text-white hover:bg-amber-700 rounded-2xl px-10 py-6 text-xl font-semibold transition-all shadow-lg hover:shadow-xl"
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
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(-30px) translateX(15px) rotate(5deg);
          }
          50% {
            transform: translateY(-50px) translateX(-12px) rotate(-3deg);
          }
          75% {
            transform: translateY(-25px) translateX(18px) rotate(2deg);
          }
        }
        .floating-symbol {
          animation: float-drift ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  )
}

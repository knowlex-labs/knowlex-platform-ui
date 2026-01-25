import { Button } from '@/components/ui/button'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

interface HeroProps {
  onTryIt: () => void
  onContinueAsGuest: () => void
}

export function Hero({ onTryIt, onContinueAsGuest }: HeroProps) {
  return (
    <div className="min-h-screen flex flex-col bg-ledger-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-ledger-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xl font-serif font-semibold text-ledger-black">
            {APP_NAME}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onTryIt}>
          Try It
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-semibold text-ledger-black leading-tight mb-6">
            {APP_NAME}
          </h1>
          <p className="text-xl md:text-2xl font-serif text-ledger-gray-600 mb-8">
            {APP_TAGLINE}
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <Button size="lg" onClick={onTryIt}>
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-sm text-ledger-gray-500 hover:text-ledger-black underline underline-offset-2 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-ledger-gray-200">
        <p className="text-sm text-ledger-gray-500 text-center">
          &copy; 2024 Knowlex AI. Built for Indian Law Firms.
        </p>
      </footer>
    </div>
  )
}

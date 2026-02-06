import { Button } from '@/components/ui/button'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

interface HeroSectionProps {
  onGetStarted: () => void
  onContinueAsGuest: () => void
}

export function HeroSection({ onGetStarted, onContinueAsGuest }: HeroSectionProps) {
  const scrollToFeatures = () => {
    const element = document.getElementById('features')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="py-12 sm:py-16 md:py-24 lg:py-32 bg-ledger-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-ledger-black leading-tight mb-4 sm:mb-6">
            {APP_NAME}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-serif text-ledger-gray-600 mb-6 sm:mb-8">
            {APP_TAGLINE}
          </p>
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button size="lg" onClick={onGetStarted} className="w-full sm:w-auto">
                Get Started
              </Button>
              <Button variant="outline" size="lg" onClick={scrollToFeatures} className="w-full sm:w-auto">
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
      </div>
    </section>
  )
}

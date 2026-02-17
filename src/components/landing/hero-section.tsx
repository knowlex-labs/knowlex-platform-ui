import { Button } from '@/components/ui/button'
import { DashboardMockup } from './dashboard-mockup'

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
    <section className="relative py-16 sm:py-20 md:py-28 lg:py-36 bg-[#16103a] overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #8b7cf7 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column — text */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-white leading-[1.05] mb-4 sm:mb-6">
              Smart Legal Assistant built for{' '}
              <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                Indian Legal Firms
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-10 max-w-lg leading-relaxed">
              Draft legal documents, research case law, and manage your practice — all powered by AI built for Indian lawyers.
            </p>
            <div className="flex flex-col items-start gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto bg-white text-[#16103a] hover:bg-gray-100 font-semibold"
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={scrollToFeatures}
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                >
                  Learn More
                </Button>
              </div>
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-sm text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Continue as Guest
              </button>
            </div>

            {/* Social proof badge */}
            <div className="mt-8 sm:mt-10 inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <div className="flex -space-x-1.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-purple-400/40 border-2 border-[#16103a]" />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-medium">Trusted by 500+ legal professionals</span>
            </div>
          </div>

          {/* Right column — dashboard mockup */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

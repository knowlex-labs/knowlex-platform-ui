import { Button } from '@/components/ui/button'
import { HeroSlideshow } from './hero-slideshow'

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
        {/* Text — centered */}
        <div className="animate-fade-in-up text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-white leading-[1.05] mb-4 sm:mb-6">
            Your Smart{' '}
            <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Legal Assistant
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 mb-8 sm:mb-10 leading-relaxed">
            AI-powered drafting, case law research, and practice management — built specifically for Indian legal professionals.
          </p>
          <div className="flex flex-col items-center gap-3 sm:gap-4">
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
              className="text-sm text-white/50 hover:text-white underline underline-offset-2 transition-colors"
            >
              Continue as Guest
            </button>
          </div>

          {/* Social proof badge */}
          <div className="mt-8 sm:mt-10 inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <span className="text-xs text-white/50 font-medium">Trusted by 500+ legal professionals</span>
          </div>
        </div>

        {/* Slideshow — full width below text */}
        <div className="animate-fade-in-up mt-12 sm:mt-16" style={{ animationDelay: '0.3s' }}>
          <HeroSlideshow />
        </div>
      </div>
    </section>
  )
}

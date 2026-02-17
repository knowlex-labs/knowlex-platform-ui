import { Button } from '@/components/ui/button'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface CTASectionProps {
  onGetStarted: () => void
  onContinueAsGuest: () => void
}

export function CTASection({ onGetStarted, onContinueAsGuest }: CTASectionProps) {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-20 md:py-28 bg-[#16103a] scroll-reveal ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-white mb-3 sm:mb-4">
          Ready to streamline your practice?
        </h2>
        <p className="text-base sm:text-lg text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Join lawyers across India who are already using Knowlex to manage their practice more efficiently.
        </p>
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-white text-[#16103a] hover:bg-gray-100 font-semibold"
          >
            Get Started Free
          </Button>
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="text-sm text-white/50 hover:text-white underline underline-offset-2 transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </section>
  )
}

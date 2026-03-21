import { Button } from '@/components/ui/button'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { useNavigate } from 'react-router-dom'

const CALENDLY_URL = 'https://calendly.com/nakul-jain-getknowlex/30min'

export function CTASection() {
  const { ref, isVisible } = useScrollReveal()
  const navigate = useNavigate()

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-20 md:py-28 bg-[#2d1518] scroll-reveal ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-white mb-3 sm:mb-4">
          Ready to streamline your practice?
        </h2>
        <p className="text-base sm:text-lg text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Join lawyers across India who are already using Knowlex to manage their practice more efficiently.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-white text-[#2d1518] hover:bg-gray-100 font-semibold"
          >
            Try for Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.open(CALENDLY_URL, '_blank')}
            className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white/10 font-semibold"
          >
            Book a Demo
          </Button>
        </div>
      </div>
    </section>
  )
}

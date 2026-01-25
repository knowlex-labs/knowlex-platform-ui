import { Button } from '@/components/ui/button'

interface CTASectionProps {
  onGetStarted: () => void
  onContinueAsGuest: () => void
}

export function CTASection({ onGetStarted, onContinueAsGuest }: CTASectionProps) {
  return (
    <section className="py-16 md:py-24 bg-ledger-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-ledger-black mb-4">
            Ready to streamline your practice?
          </h2>
          <p className="text-lg text-ledger-gray-600 mb-8">
            Join lawyers across India who are already using Knowlex to manage their practice more efficiently.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" onClick={onGetStarted}>
              Get Started Free
            </Button>
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

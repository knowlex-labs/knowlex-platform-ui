import { APP_NAME } from '@/lib/constants'

export function LandingFooter() {
  return (
    <footer className="relative py-6 sm:py-8 border-t border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Overlay handled globally */}

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-white/60 text-center">
            &copy; 2025 {APP_NAME}.
          </p>
        </div>
      </div>
    </footer>
  )
}

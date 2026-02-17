import { APP_NAME } from '@/lib/constants'

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-6 sm:py-8 bg-[#16103a] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
            &copy; {currentYear} {APP_NAME}. Built for Indian Law Firms.
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="#"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

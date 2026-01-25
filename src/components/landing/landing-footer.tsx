import { APP_NAME } from '@/lib/constants'

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-8 bg-ledger-white border-t border-ledger-gray-200">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ledger-gray-500">
            &copy; {currentYear} {APP_NAME}. Built for Indian Law Firms.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-ledger-gray-500 hover:text-ledger-black transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-ledger-gray-500 hover:text-ledger-black transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

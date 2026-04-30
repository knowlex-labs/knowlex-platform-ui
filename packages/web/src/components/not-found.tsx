import { dashboardUrl } from '@/lib/hosts'

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ledger-white">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-semibold text-kx-primary-900 mb-2">404</h1>
        <p className="text-ledger-gray-600 mb-6">Page not found</p>
        <a
          href={dashboardUrl('/home')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-ledger-white bg-kx-primary-600 rounded hover:bg-ledger-gray-800 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

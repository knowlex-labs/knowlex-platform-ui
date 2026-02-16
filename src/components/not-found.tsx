import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ledger-white">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-semibold text-ledger-black mb-2">404</h1>
        <p className="text-ledger-gray-600 mb-6">Page not found</p>
        <Link
          to="/home"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-ledger-white bg-ledger-black rounded hover:bg-ledger-gray-800 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

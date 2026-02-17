import { Clock } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Icon Container */}
      <div className="border-2 border-ledger-gray-300 border-dashed rounded p-8 mb-6">
        <div className="border border-ledger-gray-200 rounded p-4 bg-ledger-gray-50">
          <Clock className="h-12 w-12 text-ledger-gray-400" />
        </div>
      </div>

      {/* Badge */}
      <div className="inline-flex items-center px-4 py-2 border border-kx-primary-600 rounded-sm mb-4">
        <span className="text-sm font-medium text-kx-primary-900 uppercase tracking-wide">
          Coming Soon
        </span>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-serif font-semibold text-kx-primary-900 mb-2">
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p className="text-sm text-ledger-gray-500 text-center max-w-md">
          {description}
        </p>
      )}

      {/* Wireframe Lines */}
      <div className="mt-8 w-full max-w-sm space-y-3">
        <div className="h-3 bg-ledger-gray-100 rounded-sm w-full" />
        <div className="h-3 bg-ledger-gray-100 rounded-sm w-4/5" />
        <div className="h-3 bg-ledger-gray-100 rounded-sm w-3/5" />
      </div>
    </div>
  )
}

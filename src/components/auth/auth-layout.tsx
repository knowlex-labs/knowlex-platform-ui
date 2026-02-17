import { Link } from 'react-router-dom'
import { APP_NAME } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile: gradient header strip */}
      <div className="lg:hidden mesh-gradient px-6 py-8 text-center">
        <h1 className="text-2xl font-serif font-semibold text-white">{APP_NAME}</h1>
        <p className="text-sm text-kx-primary-200 mt-1">India's Smart Legal Workflow</p>
      </div>

      {/* Left panel — form (always white) */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-6 py-10 lg:py-0 bg-white force-light">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right panel — branding (desktop only, dark) */}
      <div className="hidden lg:flex lg:w-1/2 mesh-gradient relative items-center justify-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-[-120px] left-[-60px] w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 text-center px-12">
          <h1 className="text-5xl font-serif font-semibold text-white mb-4">{APP_NAME}</h1>
          <p className="text-xl text-indigo-200 font-light">
            India's Smart Legal Workflow
          </p>
          <p className="text-sm text-indigo-300/80 mt-6 max-w-sm mx-auto leading-relaxed">
            AI-powered drafting, legal research, and client management — built for Indian law firms.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-8 text-sm text-white/70 hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Learn More
          </Link>
        </div>
      </div>
    </div>
  )
}

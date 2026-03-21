import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HeroSlideshow } from './hero-slideshow'

const CALENDLY_URL = 'https://calendly.com/nakul-jain-getknowlex/30min'

export function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 bg-[#2d1518] overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #c4795a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-red-900/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-800/10 rounded-full blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — Text */}
          <div className="animate-fade-in-up lg:w-[38%] lg:flex-shrink-0 text-center lg:text-left max-w-xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-white leading-[1.05] mb-4 sm:mb-6">
              Your Smart{' '}
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-red-400 bg-clip-text text-transparent">
                Legal Assistant
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed">
              AI-powered drafting, research, and practice management — built for Indian lawyers.
            </p>

            {/* Social proof badges */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <span className="text-xs text-white/50 font-medium">Trusted by 500+ legal professionals</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs text-white/50 font-medium">50,000+ Indian judgements indexed</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-8 justify-center lg:justify-start">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-base font-semibold bg-white text-[#7a2e2e] rounded-full px-6 py-2.5 hover:bg-gray-100 transition-all"
              >
                Try for Free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open(CALENDLY_URL, '_blank')}
                className="text-base font-semibold text-white border border-white/40 rounded-full px-6 py-2.5 hover:bg-white/10 transition-all"
              >
                Book a Demo
              </button>
            </div>
          </div>

          {/* Right — Slideshow */}
          <div className="animate-fade-in-up lg:w-[62%] lg:flex-shrink-0 w-full min-w-0" style={{ animationDelay: '0.3s' }}>
            <HeroSlideshow />
          </div>
        </div>
      </div>
    </section>
  )
}

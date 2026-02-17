import * as React from 'react'
import { APP_NAME } from '@/lib/constants'
import { Menu, X } from 'lucide-react'

interface LandingHeaderProps {
  onSignIn: () => void
}

const navLinks = [
  { label: 'Features', sectionId: 'features' },
  { label: 'Pricing', sectionId: 'pricing' },
  { label: 'About Us', sectionId: 'about' },
]

export function LandingHeader({ onSignIn }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#2a3eb1] border-b-0 shadow-[0_8px_30px_rgba(22,16,58,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-center h-[60px] relative">
          {/* Logo — left */}
          <div className="absolute left-0 flex items-center">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-2xl font-serif font-bold text-white tracking-tight hover:opacity-90 transition-opacity"
            >
              {APP_NAME}
            </button>
          </div>

          {/* Desktop Navigation — centered */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.sectionId}
                type="button"
                onClick={() => scrollToSection(link.sectionId)}
                className="text-base font-medium text-white/90 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Book a Demo — right */}
          <div className="hidden md:block absolute right-0">
            <button
              onClick={onSignIn}
              className="text-base font-semibold text-white border-2 border-white rounded-full px-6 py-2 hover:bg-white hover:text-[#2a3eb1] transition-all"
            >
              Book a Demo
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-white/90 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.sectionId}
                  type="button"
                  onClick={() => scrollToSection(link.sectionId)}
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors text-left py-2"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => {
                  onSignIn()
                  setMobileMenuOpen(false)
                }}
                className="text-sm font-medium text-white border border-white/30 hover:border-white/60 hover:bg-white/10 rounded-full px-5 py-2.5 transition-all w-full"
              >
                Book a Demo
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

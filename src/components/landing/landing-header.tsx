import * as React from 'react'
import { APP_NAME } from '@/lib/constants'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Features', sectionId: 'features' },
  { label: 'Team', sectionId: 'team' },
  { label: 'About', sectionId: 'about' },
]

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent pt-4 sm:pt-6">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {APP_NAME}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.sectionId}
                type="button"
                onClick={() => scrollToSection(link.sectionId)}
                className="text-base font-semibold text-gray-900/90 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-900/90 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/20 bg-black/50 backdrop-blur-md -mx-4 px-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.sectionId}
                  type="button"
                  onClick={() => scrollToSection(link.sectionId)}
                  className="text-base font-semibold text-gray-900/90 hover:text-gray-900 transition-colors text-left py-2"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

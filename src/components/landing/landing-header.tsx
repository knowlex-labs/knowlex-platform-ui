import * as React from 'react'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'
import { Menu, X } from 'lucide-react'

interface LandingHeaderProps {
  onSignIn: () => void
}

const navLinks = [
  { label: 'Features', sectionId: 'features' },
  { label: 'Pricing', sectionId: 'pricing' },
  { label: 'Team', sectionId: 'team' },
  { label: 'About', sectionId: 'about' },
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
    <header className="sticky top-0 z-50 bg-ledger-white border-b border-ledger-gray-200">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-serif font-semibold text-ledger-black">
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
                className="text-sm font-medium text-ledger-gray-600 hover:text-ledger-black transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Button variant="outline" size="sm" onClick={onSignIn}>
              Sign In
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-ledger-gray-600 hover:text-ledger-black"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-ledger-gray-200">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.sectionId}
                  type="button"
                  onClick={() => scrollToSection(link.sectionId)}
                  className="text-sm font-medium text-ledger-gray-600 hover:text-ledger-black transition-colors text-left py-2"
                >
                  {link.label}
                </button>
              ))}
              <Button variant="outline" size="sm" onClick={onSignIn} className="w-full">
                Sign In
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

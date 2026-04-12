import * as React from 'react'
import { Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

const CALENDLY_URL = 'https://calendly.com/nakul-jain-getknowlex/30min'

interface LandingHeaderProps {
  onSignIn: () => void
}

const navLinks: { label: string; sectionId?: string; href?: string }[] = [
  { label: 'Features', sectionId: 'features' },
  { label: 'Pricing', sectionId: 'pricing' },
  { label: 'About Us', sectionId: 'about' },
  { label: 'Blogs', href: '/blogs' },
]

export function LandingHeader({ onSignIn: _onSignIn }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [calendlyOpen, setCalendlyOpen] = React.useState(false)
  const navigate = useNavigate()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-kx-primary-600 border-b-0 shadow-[0_4px_20px_rgba(45,21,24,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-center h-[48px] relative">
            {/* Logo — left */}
            <div className="absolute left-0 flex items-center">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-7 w-auto invert" />
                <span className="text-xl font-serif font-bold text-white tracking-tight">Knowlex</span>
              </button>
            </div>

            {/* Desktop Navigation — centered */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) =>
                link.href ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <button
                    key={link.sectionId}
                    type="button"
                    onClick={() => scrollToSection(link.sectionId!)}
                    className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                )
              )}
            </nav>

            {/* CTAs — right */}
            <div className="hidden md:flex items-center gap-2 absolute right-0">
              <button
                onClick={() => setCalendlyOpen(true)}
                className="text-sm font-medium text-white/90 border border-white/40 rounded-full px-4 py-1.5 hover:bg-white/10 hover:border-white/70 transition-all tracking-wide"
              >
                Book a Demo
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-kx-primary-600 bg-white/95 rounded-full px-4 py-1.5 hover:bg-white transition-all tracking-wide"
              >
                Sign In
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden p-2 text-white/90 hover:text-white absolute right-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-3 border-t border-white/10">
              <div className="flex flex-col gap-3">
                {navLinks.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-white/80 hover:text-white transition-colors text-left py-1.5"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      key={link.sectionId}
                      type="button"
                      onClick={() => scrollToSection(link.sectionId!)}
                      className="text-sm font-medium text-white/80 hover:text-white transition-colors text-left py-1.5"
                    >
                      {link.label}
                    </button>
                  )
                )}
                <button
                  onClick={() => {
                    navigate('/login')
                    setMobileMenuOpen(false)
                  }}
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors text-left py-1.5"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setCalendlyOpen(true)
                    setMobileMenuOpen(false)
                  }}
                  className="text-sm font-medium text-white border border-white/30 hover:border-white/60 hover:bg-white/10 rounded-full px-5 py-2 transition-all w-full"
                >
                  Book a Demo
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Calendly Dialog */}
      <Dialog open={calendlyOpen} onOpenChange={setCalendlyOpen}>
        <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden h-[85vh] sm:h-[700px]">
          <DialogTitle className="sr-only">Book a Demo</DialogTitle>
          <iframe
            src={CALENDLY_URL}
            title="Book a Demo"
            className="w-full h-full border-0"
          />
          {/* White circle behind the close button so it's visible on Calendly's white bg */}
          <div className="absolute right-4 top-4 w-6 h-6 bg-white rounded-full -z-10" />
        </DialogContent>
      </Dialog>
    </>
  )
}

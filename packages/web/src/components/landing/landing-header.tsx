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
  { label: 'Features', href: '/#features' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Careers', href: '/careers' },
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
      <header className="sticky top-0 z-50 bg-kx-primary-700 shadow-[0_4px_20px_rgba(45,21,24,0.4)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="relative flex items-center justify-between h-16">
            {/* Logo — left */}
            <button
              type="button"
              onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-7 w-auto invert" />
              <span className="text-xl font-serif font-bold text-white tracking-tight">Knowlex</span>
            </button>

            {/* Desktop Nav — truly centered */}
            <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5 bg-white/10 rounded-full px-1.5 py-1">
              {navLinks.map((link) =>
                link.href ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors px-4 py-1.5 rounded-full"
                  >
                    {link.label}
                  </a>
                ) : (
                  <button
                    key={link.sectionId}
                    type="button"
                    onClick={() => scrollToSection(link.sectionId!)}
                    className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors px-4 py-1.5 rounded-full"
                  >
                    {link.label}
                  </button>
                )
              )}
            </nav>

            {/* CTAs — right */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setCalendlyOpen(true)}
                className="text-sm font-medium text-white/90 border border-white/30 rounded-full px-4 py-1.5 hover:bg-white/10 hover:border-white/60 transition-all"
              >
                Book a Demo
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-semibold text-kx-primary-800 bg-white rounded-full px-4 py-1.5 hover:bg-amber-50 transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-3 border-t border-white/10">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors px-3 py-2 rounded-lg"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      key={link.sectionId}
                      type="button"
                      onClick={() => scrollToSection(link.sectionId!)}
                      className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left px-3 py-2 rounded-lg"
                    >
                      {link.label}
                    </button>
                  )
                )}
                <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                    className="text-sm font-semibold text-kx-primary-800 bg-white rounded-full px-4 py-2 hover:bg-amber-50 transition-colors w-full"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setCalendlyOpen(true); setMobileMenuOpen(false) }}
                    className="text-sm font-medium text-white/90 border border-white/30 rounded-full px-4 py-2 hover:bg-white/10 transition-all w-full"
                  >
                    Book a Demo
                  </button>
                </div>
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
          <div className="absolute right-4 top-4 w-6 h-6 bg-white rounded-full -z-10" />
        </DialogContent>
      </Dialog>
    </>
  )
}

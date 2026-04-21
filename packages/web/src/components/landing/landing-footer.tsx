import { Linkedin, Mail, MapPin } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { useNavigate } from 'react-router-dom'

const PRODUCT_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
]

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Team', href: '/about' },
  { label: 'FAQs', href: '/#faq' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'Careers', href: '/careers' },
]

const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/knowlexai', Icon: Linkedin },
  { label: 'Email', href: 'mailto:nakul.jain@getknowlex.com', Icon: Mail },
]

export function LandingFooter() {
  const currentYear = new Date().getFullYear()
  const navigate = useNavigate()

  return (
    <footer className="bg-kx-primary-950 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-5 space-y-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <img src="/logo/knowlex_logo.png" alt={APP_NAME} className="h-7 w-auto invert" />
              <span className="text-xl font-serif font-bold text-white tracking-tight">
                {APP_NAME}
              </span>
            </button>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Contextual AI built for Indian legal practice — drafting, research, and case
              management in one workspace.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-amber-300 hover:border-amber-300/40 hover:bg-white/5 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:nakul.jain@getknowlex.com"
                  className="flex items-start gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                  <span>nakul.jain@getknowlex.com</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                <span>Bengaluru, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40 text-center sm:text-left">
            &copy; {currentYear} {APP_NAME}. Built for Indian Law Firms.
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, FileText, CalendarDays, MessagesSquare } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const CALENDLY_URL = 'https://calendly.com/nakul-jain-getknowlex/30min'

const ACTIVITY_CARDS = [
  {
    icon: FileText,
    iconBg: 'bg-kx-primary-500/20',
    iconColor: 'text-amber-300',
    label: 'Draft generated',
    sub: 'Legal Notice · Section 138 NI Act',
    badge: '48s',
    badgeColor: 'text-emerald-400 bg-emerald-400/10',
    enterDelay: 0.55,
  },
  {
    icon: CalendarDays,
    iconBg: 'bg-amber-400/20',
    iconColor: 'text-amber-300',
    label: 'Hearing tomorrow',
    sub: 'Bombay HC · Court 7 · 10:30 AM',
    badge: 'Scheduled',
    badgeColor: 'text-amber-300 bg-amber-400/10',
    enterDelay: 0.72,
  },
  {
    icon: MessagesSquare,
    iconBg: 'bg-emerald-400/20',
    iconColor: 'text-emerald-300',
    label: 'Summary ready',
    sub: 'FIR_Sharma_2024.pdf · 3 pages',
    badge: 'Cited',
    badgeColor: 'text-emerald-400 bg-emerald-400/10',
    enterDelay: 0.89,
  },
]

export function HeroSection() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative py-20 sm:py-24 md:py-32 bg-kx-primary-950 overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #c4795a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-kx-primary-800/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[28rem] h-[20rem] bg-amber-700/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 md:px-8 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' as const }}
          className="text-xs font-semibold tracking-[0.22em] uppercase text-amber-400/80 mb-5"
        >
          AI-powered legal workspace for India
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' as const, delay: 0.08 }}
          className="font-serif font-semibold text-white leading-[1.1] tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-[4rem]"
        >
          Your Smart{' '}
          <span
            className="inline-block bg-gradient-to-r from-amber-300 via-orange-300 to-red-400 bg-clip-text text-transparent"
            style={{ paddingBottom: '0.1em' }}
          >
            Legal Assistant
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' as const }}
          className="mt-6 text-lg sm:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto"
        >
          Contextual AI built for Indian legal practice — draft documents, manage your practice,
          and research cases in one workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5, ease: 'easeOut' as const }}
          className="flex flex-wrap gap-3 sm:gap-4 mt-9 justify-center"
        >
          <motion.button
            whileHover={reduceMotion ? undefined : { y: -2, boxShadow: '0 14px 30px -10px rgba(255,200,100,0.5)' }}
            whileTap={reduceMotion ? undefined : { y: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold bg-white text-kx-primary-700 rounded-full px-7 sm:px-8 py-3 hover:bg-amber-50 transition-colors"
          >
            Try for Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
          <motion.button
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={reduceMotion ? undefined : { y: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => window.open(CALENDLY_URL, '_blank')}
            className="text-base sm:text-lg font-semibold text-white border border-white/30 rounded-full px-7 sm:px-8 py-3 hover:bg-white/10 hover:border-white/50 transition-colors"
          >
            Book a Demo
          </motion.button>
        </motion.div>

        {/* Floating activity cards */}
        <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row items-center justify-center gap-4">
          {ACTIVITY_CARDS.map(({ icon: Icon, iconBg, iconColor, label, sub, badge, badgeColor, enterDelay }) => (
            <motion.div
              key={label}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: enterDelay, duration: 0.5, ease: 'easeOut' as const }}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm w-full sm:w-auto max-w-xs"
            >
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white leading-none">{label}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                </div>
                <p className="text-xs text-white/50 mt-1 truncate">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="mt-14 sm:mt-16">
          <motion.button
            type="button"
            onClick={scrollToFeatures}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    y: [0, 6, 0],
                    transition: {
                      opacity: { delay: 1, duration: 0.5 },
                      y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const, delay: 1.5 },
                    },
                  }
            }
            className="inline-flex flex-col items-center gap-1 text-xs uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors"
            aria-label="Scroll to features"
          >
            Explore features
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </section>
  )
}

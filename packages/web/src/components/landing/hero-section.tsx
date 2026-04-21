import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { HeroSlideshow } from './hero-slideshow'

const CALENDLY_URL = 'https://calendly.com/nakul-jain-getknowlex/30min'

export function HeroSection() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative py-16 sm:py-20 md:py-24 bg-kx-primary-950 overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #c4795a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Static ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[34rem] h-[34rem] bg-red-900/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-amber-700/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left — copy + CTAs */}
          <div className="lg:col-span-5 text-center lg:text-left">
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="font-serif font-semibold text-white leading-[1.1] tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.5rem]"
            >
              <span className="block">Your Smart</span>
              <span
                className="inline-block bg-gradient-to-r from-amber-300 via-orange-300 to-red-400 bg-clip-text text-transparent"
                style={{ paddingBottom: '0.12em' }}
              >
                Legal Assistant
              </span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Contextual AI built for Indian legal practice — drafting, research, and case
              management in one workspace.
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap gap-3 sm:gap-4 mt-8 sm:mt-10 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={
                  reduceMotion
                    ? undefined
                    : { y: -2, boxShadow: '0 14px 30px -10px rgba(255, 200, 100, 0.5)' }
                }
                whileTap={reduceMotion ? undefined : { y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold bg-white text-kx-primary-700 rounded-full px-7 sm:px-8 py-3 hover:bg-amber-50 transition-colors"
              >
                Try for Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => window.open(CALENDLY_URL, '_blank')}
                className="text-base sm:text-lg font-semibold text-white border border-white/40 rounded-full px-7 sm:px-8 py-3 hover:bg-white/10 hover:border-white/60 transition-colors"
              >
                Book a Demo
              </motion.button>
            </motion.div>
          </div>

          {/* Right — slideshow of product screenshots */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <HeroSlideshow />
          </motion.div>
        </div>

        <div className="text-center mt-14 sm:mt-16">
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
                      opacity: { delay: 0.8, duration: 0.5 },
                      y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const, delay: 1.3 },
                    },
                  }
            }
            className="inline-flex flex-col items-center gap-1 text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors"
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

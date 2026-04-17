import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

interface Slide {
  image: string
  title: string
  alt: string
}

const SLIDES: Slide[] = [
  {
    image: '/screenshots/dashboard.png',
    title: 'Command Center',
    alt: 'Knowlex dashboard showing case overview and recent activity',
  },
  {
    image: '/screenshots/cases.png',
    title: 'Case Workspace',
    alt: 'Case workspace with documents, sources, and notes',
  },
  {
    image: '/screenshots/workspace-draft.png',
    title: 'Live Draft Preview',
    alt: 'Live preview of an AI-generated legal draft',
  },
  {
    image: '/screenshots/workspace-chat.png',
    title: 'AI Assistant',
    alt: 'Chat-based AI assistant refining a draft',
  },
  {
    image: '/screenshots/drafting.png',
    title: 'Draft Generation',
    alt: 'Draft generation wizard for legal templates',
  },
  {
    image: '/screenshots/ai-research.png',
    title: 'AI Research',
    alt: 'AI research interface for legal queries',
  },
  {
    image: '/screenshots/clients.png',
    title: 'Client Management',
    alt: 'Client directory and relationship view',
  },
]

const AUTOPLAY_MS = 4500

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reduceMotion = useReducedMotion()

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTick = useCallback(() => {
    clearTick()
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
  }, [clearTick])

  useEffect(() => {
    if (paused || reduceMotion) {
      clearTick()
      return
    }
    startTick()
    return clearTick
  }, [paused, reduceMotion, startTick, clearTick])

  const goTo = (i: number) => {
    if (i === current) return
    setCurrent(i)
    if (!paused && !reduceMotion) startTick()
  }

  const float = reduceMotion
    ? undefined
    : {
        y: [0, -10, 0],
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
      }

  const active = SLIDES[current]
  const counter = `${String(current + 1).padStart(2, '0')} / ${String(SLIDES.length).padStart(2, '0')}`

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -inset-6 sm:-inset-10 bg-gradient-to-tr from-amber-500/25 via-orange-400/15 to-red-500/15 blur-3xl rounded-[60px] pointer-events-none" />

      <motion.div
        animate={float}
        role="region"
        aria-roledescription="carousel"
        aria-label="Product screenshots"
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-white/10 bg-kx-primary-950 shadow-2xl shadow-black/50"
      >
        {/* Browser-chrome strip with title + counter */}
        <div
          aria-live="polite"
          className="h-9 bg-kx-primary-950 border-b border-white/10 flex items-center gap-2 px-3 sm:px-4"
        >
          <span className="w-2 h-2 rounded-full bg-red-400/80" />
          <span className="w-2 h-2 rounded-full bg-amber-400/80" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-amber-200/90 truncate">
            {active.title}
          </span>
          <span className="ml-auto text-[10px] font-mono text-white/40">{counter}</span>
        </div>

        {/* Image stage */}
        <div className="relative aspect-[16/9] bg-kx-primary-950">
          {/* Preload layer — mounts all images once so swaps are instant */}
          <div className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden="true">
            {SLIDES.map((s) => (
              <img key={`pre-${s.image}`} src={s.image} alt="" loading="eager" />
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={active.image}
              src={active.image}
              alt={active.alt}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </AnimatePresence>
        </div>

        <span className="sr-only">
          Slide {current + 1} of {SLIDES.length}: {active.title}
        </span>
      </motion.div>

      {/* Dots */}
      <div className="relative flex justify-center items-center gap-2 mt-5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}: ${slide.title}`}
            aria-current={i === current ? 'true' : undefined}
            className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-kx-primary-950 ${
              i === current ? 'w-6 bg-amber-300' : 'w-1.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  { src: '/screenshots/dashboard.png', label: 'Dashboard' },
  { src: '/screenshots/workspace-draft.png', label: 'AI Drafting' },
  { src: '/screenshots/workspace-chat.png', label: 'AI Assistant' },
  { src: '/screenshots/clients.png', label: 'Clients' },
  { src: '/screenshots/ai-research.png', label: 'AI Research' },
]

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 4000)
  }, [])

  useEffect(() => {
    if (!paused) {
      startInterval()
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, startInterval])

  const goToSlide = (index: number) => {
    setCurrent(index)
    if (!paused) startInterval()
  }

  const goPrev = () => {
    goToSlide((current - 1 + slides.length) % slides.length)
  }

  const goNext = () => {
    goToSlide((current + 1) % slides.length)
  }

  return (
    <div
      className="rounded-xl shadow-2xl overflow-hidden border border-gray-200/60 transition-transform duration-500 hover:scale-[1.01]"
      style={{
        transform: 'perspective(1200px) rotateY(-2deg) rotateX(1deg)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#2d1518]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[11px] text-white/50 ml-2 font-medium">Knowlex</span>
      </div>

      {/* Slideshow area */}
      <div className="relative bg-white overflow-hidden">
        {slides.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.label}
            className={`w-full h-auto block transition-opacity duration-700 ${
              i === current ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'
            }`}
          />
        ))}

        {/* Left / Right arrows */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              aria-label={`Go to slide: ${slide.label}`}
              onClick={() => goToSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

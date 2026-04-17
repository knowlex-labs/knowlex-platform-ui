import { DRAFT_TEMPLATES } from '@knowlex/core/types'

const ROW_ONE = DRAFT_TEMPLATES.slice(0, Math.ceil(DRAFT_TEMPLATES.length / 2)).map((t) => t.name)
const ROW_TWO = DRAFT_TEMPLATES.slice(Math.ceil(DRAFT_TEMPLATES.length / 2)).map((t) => t.name)

export function TemplatesMarquee() {
  return (
    <section id="templates" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#fdf6ec] via-[#fefaf3] to-[#fdf6ec] relative overflow-hidden">
      {/* Soft warm blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-200/25 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 md:px-8 text-center mb-10 sm:mb-12">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-kx-primary-600 mb-3">
          Templates
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-3 leading-tight">
          {DRAFT_TEMPLATES.length}+ templates. Built for Indian courts.
        </h2>
        <p className="text-base sm:text-lg text-kx-text-secondary">
          Drafting that knows the format — from bail applications to writ petitions, in seconds.
        </p>
      </div>

      <div className="relative space-y-3 sm:space-y-4">
        <MarqueeRow items={ROW_ONE} direction="forward" />
        <MarqueeRow items={ROW_TWO} direction="reverse" />
      </div>

      {/* Edge fade masks */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#fdf6ec] to-transparent" />
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#fdf6ec] to-transparent" />
    </section>
  )
}

function MarqueeRow({
  items,
  direction,
}: {
  items: string[]
  direction: 'forward' | 'reverse'
}) {
  // Duplicate the list so the loop is seamless (we translate by -50%).
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-3 sm:gap-4 w-max ${direction === 'forward' ? 'animate-marquee' : 'animate-marquee-reverse'} hover:[animation-play-state:paused]`}
      >
        {doubled.map((name, i) => (
          <Chip key={`${name}-${i}`} name={name} />
        ))}
      </div>
    </div>
  )
}

function Chip({ name }: { name: string }) {
  return (
    <span className="shrink-0 inline-flex items-center text-sm sm:text-base font-medium text-kx-primary-900 bg-white border border-amber-200/70 shadow-sm rounded-full px-4 sm:px-5 py-2 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-default">
      {name}
    </span>
  )
}

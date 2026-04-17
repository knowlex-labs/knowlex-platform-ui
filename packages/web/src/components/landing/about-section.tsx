import { motion, useReducedMotion } from 'framer-motion'

export function AboutSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="about" className="py-16 sm:py-20 md:py-28 bg-ledger-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-kx-primary-600 mb-4">
            About Knowlex
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-6 leading-tight">
            Built for Indian lawyers, by people who’ve sat on both sides of the bench.
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary leading-relaxed mb-4">
            Knowlex addresses the unique challenges faced by legal professionals in India — managing
            high case volumes, navigating complex court schedules, and producing court-ready
            documents at speed.
          </p>
          <p className="text-base sm:text-lg text-kx-text-secondary leading-relaxed">
            Our platform combines modern technology with a deep understanding of Indian legal
            workflows so you can focus on what matters — serving your clients and growing your
            practice.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

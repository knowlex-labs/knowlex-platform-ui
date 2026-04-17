import type { LucideIcon } from 'lucide-react'
import { FileText, Users, MessagesSquare } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

interface Feature {
  title: string
  description: string
  bullets: string[]
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

const FEATURES: Feature[] = [
  {
    title: 'Drafting Assistant',
    description:
      'Generate court-ready legal documents from 20+ Indian templates. Citations and provisions auto-sourced.',
    bullets: [
      'Notices, bail applications, writ petitions and more',
      'Live preview while the AI drafts section by section',
      'Refine any paragraph in chat — draft updates instantly',
    ],
    icon: FileText,
    iconBg: 'bg-kx-primary-50',
    iconColor: 'text-kx-primary-700',
  },
  {
    title: 'Practice Management',
    description:
      'Run your entire practice in one place — cause lists, clients, billings and tasks, all connected.',
    bullets: [
      'Cause list automation — see your next hearing at a glance',
      'All clients and cases in one organised dashboard',
      'Generate invoices and manage billings per case',
      'Pending and active task lists so nothing slips',
    ],
    icon: Users,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
  },
  {
    title: 'Summaries & Case Studies',
    description:
      'Turn long documents into clean summaries, synopses, translations and case studies — with chat over your files for grounded answers.',
    bullets: [
      'Translate documents between English and Indian languages',
      'Summarise long judgements and FIRs in seconds',
      'Generate synopses and case studies in your voice',
      'Chat with case files — answers cited to the source',
    ],
    icon: MessagesSquare,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
  },
]

export function FeaturesSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="features" className="py-16 sm:py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-14 sm:mb-16"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-kx-primary-600 mb-3">
            Features
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-3 leading-tight">
            Everything you need to practice law.
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary max-w-2xl mx-auto">
            Powerful tools designed specifically for Indian legal professionals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} reduceMotion={!!reduceMotion} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  feature,
  index,
  reduceMotion,
}: {
  feature: Feature
  index: number
  reduceMotion: boolean
}) {
  const { title, description, bullets, icon: Icon, iconBg, iconColor } = feature

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
      className="group relative rounded-2xl bg-white ring-1 ring-ledger-gray-200/80 p-7 sm:p-8 hover:ring-kx-primary-200 hover:shadow-lg hover:shadow-kx-primary-900/5 transition-all duration-300"
    >
      <div
        className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${iconBg} mb-6`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      <h3 className="text-xl sm:text-[22px] font-serif font-semibold text-kx-text-primary mb-3 leading-snug">
        {title}
      </h3>
      <p className="text-sm sm:text-[15px] text-kx-text-secondary leading-relaxed">
        {description}
      </p>

      <div className="my-6 border-t border-ledger-gray-100" />

      <ul className="space-y-2.5">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2.5 text-sm text-kx-text-secondary leading-relaxed"
          >
            <span className="mt-[7px] w-1 h-1 rounded-full bg-ledger-gray-400 shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

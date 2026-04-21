import { FileText, CalendarDays, MessagesSquare, CheckCircle, BookOpen, Users, FileStack } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'


const CAUSE_LIST_ITEMS = [
  { label: 'Today', items: [
    { case: 'Sharma v. State of Maharashtra', court: 'Bombay HC · Court 7', time: '10:30 AM' },
    { case: 'Mehta & Sons v. Union of India', court: 'Supreme Court · Court 3', time: '2:00 PM' },
  ]},
  { label: 'Tomorrow', items: [
    { case: 'Priya Nair v. Municipal Corp.', court: 'Delhi HC · Court 12', time: '11:00 AM' },
  ]},
]

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.55, ease: 'easeOut' as const, delay },
  }
}

export function FeaturesSection() {
  const reduceMotion = useReducedMotion()

  const anim = (delay = 0) =>
    reduceMotion ? { initial: false as const, whileInView: { opacity: 1, y: 0 } } : fadeUp(delay)

  return (
    <section id="features" className="bg-white overflow-hidden">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-16 sm:pt-20 md:pt-28 pb-12 text-center">
        <motion.div {...anim()}>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-kx-primary-600 mb-3">
            Features
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-4 leading-tight">
            Everything you need to practice law.
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary max-w-2xl mx-auto">
            Purpose-built for Indian legal professionals — accurate, grounded, and fast.
          </p>
        </motion.div>
      </div>

      {/* Block 1 — AI Drafting */}
      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <motion.div {...anim(0.05)}>
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-kx-primary-50 mb-6">
                <FileText className="w-5 h-5 text-kx-primary-700" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary mb-4 leading-snug">
                Court-ready drafts<br />in under 60 seconds
              </h3>
              <p className="text-base text-kx-text-secondary leading-relaxed mb-6">
                Start from 20+ pre-built Indian legal templates or create your own custom
                templates to match your exact style and format. Knowlex writes each section with
                the correct provisions auto-sourced — then lets you refine any paragraph in chat.
              </p>
              <ul className="space-y-3">
                {[
                  'Pre-built: notices, bail applications, writ petitions and more',
                  'Custom templates — build once, reuse for every client',
                  'Live preview as the AI drafts section by section',
                  'Refine in chat — draft updates instantly',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-kx-text-secondary">
                    <CheckCircle className="w-4 h-4 text-kx-primary-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Mock document preview */}
            <motion.div {...anim(0.15)} className="max-w-md mx-auto lg:mx-0 w-full">
              <div className="bg-white rounded-2xl border border-ledger-gray-200 shadow-sm overflow-hidden">
                {/* Doc header bar */}
                <div className="px-5 py-3 border-b border-ledger-gray-100 flex items-center justify-between bg-ledger-gray-50">
                  <span className="text-xs font-semibold text-kx-text-secondary">Legal Notice — Draft</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Generated in 48s
                  </span>
                </div>
                {/* Document body */}
                <div className="px-6 py-5 font-serif text-kx-text-primary space-y-3 text-sm leading-relaxed">
                  <p className="text-center font-bold tracking-wide uppercase text-xs">Legal Notice</p>
                  <div className="text-xs text-ledger-gray-400 flex justify-between">
                    <span>Date: April 21, 2026</span>
                    <span>Ref: LN/2026/042</span>
                  </div>
                  <p className="text-xs"><span className="font-semibold">To:</span> The Managing Director, ABC Pvt. Ltd., Mumbai – 400 001</p>
                  <p className="text-xs"><span className="font-semibold">Subject:</span> Notice under Section 138, Negotiable Instruments Act, 1881</p>
                  <p className="text-xs text-kx-text-secondary leading-relaxed">
                    Under instructions from and on behalf of my client, Sh. Ramesh Kumar, I hereby
                    serve upon you this legal notice calling upon you to pay the sum of ₹4,50,000
                    (Rupees Four Lakh Fifty Thousand only) within fifteen days…
                  </p>
                  {/* Fade out */}
                  <div className="relative h-6">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Block 2 — Cause List Tracking */}
      <div className="border-t border-gray-100 bg-[#fdf6ec]/40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Cause list mock */}
            <motion.div {...anim(0.05)} className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl border border-ledger-gray-200 shadow-sm overflow-hidden max-w-md mx-auto lg:mx-0">
                <div className="px-5 py-4 border-b border-ledger-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-kx-text-primary">Upcoming hearings</span>
                  <span className="text-xs text-kx-primary-600 font-medium">3 this week</span>
                </div>
                {CAUSE_LIST_ITEMS.map(({ label, items }) => (
                  <div key={label}>
                    <div className="px-5 py-2 bg-ledger-gray-50 border-b border-ledger-gray-100">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ledger-gray-400">{label}</span>
                    </div>
                    {items.map((item) => (
                      <div key={item.case} className="px-5 py-4 border-b border-ledger-gray-100 last:border-0 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-kx-text-primary leading-snug mb-0.5">{item.case}</p>
                          <p className="text-xs text-ledger-gray-400">{item.court}</p>
                        </div>
                        <span className="text-xs font-semibold text-kx-primary-600 shrink-0 bg-kx-primary-50 px-2.5 py-1 rounded-full">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Text */}
            <motion.div {...anim(0.15)} className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 mb-6">
                <CalendarDays className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary mb-4 leading-snug">
                Never miss a hearing.<br />Ever.
              </h3>
              <p className="text-base text-kx-text-secondary leading-relaxed mb-6">
                Your cause list, clients, and cases — all connected in one place. See upcoming
                hearings at a glance, manage your entire practice from a single dashboard, and
                keep every document exactly where you need it.
              </p>
              <ul className="space-y-3">
                {[
                  'Cause list tracking across all your courts',
                  'All clients and cases in one organised dashboard',
                  'Every document linked to its case',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-kx-text-secondary">
                    <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Block 3 — Case Studio Chat */}
      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <motion.div {...anim(0.05)}>
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 mb-6">
                <MessagesSquare className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary mb-4 leading-snug">
                Your case files,<br />made intelligent
              </h3>
              <p className="text-base text-kx-text-secondary leading-relaxed mb-6">
                Upload FIRs, pleadings, judgments, and contracts. Case Studio reads them and
                becomes your research assistant — chat, summarise, and extract insights, with
                every answer cited back to the exact document and page it came from.
              </p>
              <ul className="space-y-3">
                {[
                  'Chat with any document — answers cited to source',
                  'One-click summaries of long FIRs and judgments',
                  'Generate synopsis and case study in your own voice',
                  'Ask across multiple documents at once',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-kx-text-secondary">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Chat mock */}
            <motion.div {...anim(0.15)} className="max-w-md mx-auto lg:mx-0 w-full">
              <div className="bg-white rounded-2xl border border-ledger-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-ledger-gray-100">
                  <span className="text-sm font-semibold text-kx-text-primary">Case Studio</span>
                  <span className="ml-2 text-xs text-ledger-gray-400">Sharma v. State of Maharashtra</span>
                </div>
                <div className="p-5 space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-kx-primary-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                      What are the grounds for bail mentioned in the application?
                    </div>
                  </div>
                  {/* AI response */}
                  <div className="flex flex-col gap-2">
                    <div className="bg-ledger-gray-50 border border-ledger-gray-100 text-kx-text-primary text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
                      The bail application cites three grounds: (1) the accused has no prior criminal
                      record, (2) there is no risk of tampering with evidence as key witnesses have
                      already been examined, and (3) the accused is the sole breadwinner of a
                      dependent family.
                    </div>
                    <div className="flex items-center gap-1.5 ml-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-ledger-gray-400">
                        Cited from <span className="font-medium text-kx-text-secondary">BailApplication_Sharma.pdf</span>, pg. 3
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Block 4 — Also included */}
      <div className="border-t border-gray-100 bg-[#fdf6ec]/40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 sm:py-20">
          <motion.div {...anim(0.05)} className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-kx-primary-600 mb-3">
              Also included
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-kx-text-primary leading-tight">
              Everything else your practice needs
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Judgments Library */}
            <motion.div {...anim(0.1)} className="bg-white rounded-2xl border border-ledger-gray-200 shadow-sm p-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 mb-4">
                <BookOpen className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="text-base font-semibold text-kx-text-primary mb-3">Judgments Library</h3>
              <ul className="space-y-2">
                {[
                  'Comprehensive Supreme Court & High Court judgments',
                  'Indexed and instantly searchable',
                  'Cited directly inside your drafts and research',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-kx-text-secondary">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Client Management */}
            <motion.div {...anim(0.18)} className="bg-white rounded-2xl border border-ledger-gray-200 shadow-sm p-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 mb-4">
                <Users className="w-5 h-5 text-violet-700" />
              </div>
              <h3 className="text-base font-semibold text-kx-text-primary mb-3">Client Management</h3>
              <ul className="space-y-2">
                {[
                  'All clients and cases in one organised dashboard',
                  'Every document linked to its case',
                  'Email & WhatsApp reminders sent to clients about upcoming hearings',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-kx-text-secondary">
                    <CheckCircle className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Document Tools */}
            <motion.div {...anim(0.26)} className="bg-white rounded-2xl border border-ledger-gray-200 shadow-sm p-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 mb-4">
                <FileStack className="w-5 h-5 text-rose-700" />
              </div>
              <h3 className="text-base font-semibold text-kx-text-primary mb-3">Document Tools</h3>
              <ul className="space-y-2">
                {[
                  'Split and merge PDFs in seconds',
                  'Compress and convert documents',
                  'Manage all court documents without leaving the platform',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-kx-text-secondary">
                    <CheckCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

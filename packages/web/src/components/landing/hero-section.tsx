import { useState, useEffect, type ReactNode } from 'react'
import {
  ArrowRight, Lock, Shield, Sparkles,
  FileText, CheckCircle, Languages, Scale,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { goToDashboard } from '@/lib/hosts'

const CALENDLY_URL = 'https://calendly.com/nakul-jain-getknowlex/30min'

// ─── Screen 1: Case workspace ─────────────────────────────────────────────────
function CaseDashboardScreen() {
  const rail = [
    { label: 'Sources', count: 3, active: true },
    { label: 'Notes', count: 2, active: false },
    { label: 'Drafts', count: 1, active: false },
  ]
  const docs = [
    { name: 'FIR_Sharma.pdf', meta: '4 pages · 2d ago', status: 'Indexed', ok: true },
    { name: 'ChequeBounce_Notice.pdf', meta: '2 pages · 2d ago', status: 'Indexed', ok: true },
    { name: 'Chargesheet_Draft.pdf', meta: '12 pages · 1h ago', status: 'Processing', ok: false },
  ]
  return (
    <div className="flex h-full">
      <div className="w-40 border-r border-ledger-gray-100 p-4 shrink-0 bg-ledger-gray-50/50">
        <p className="text-xs font-semibold text-kx-text-primary">State v. Sharma</p>
        <p className="text-xs text-ledger-gray-400 mt-0.5 mb-4">Sec 138 NI Act</p>
        <div className="space-y-1">
          {rail.map(({ label, count, active }) => (
            <div
              key={label}
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs',
                active
                  ? 'bg-kx-primary-50 text-kx-primary-700 font-medium'
                  : 'text-kx-text-secondary'
              )}
            >
              <span>{label}</span>
              <span className="text-ledger-gray-400">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-kx-text-primary">Case Sources</span>
          <span className="text-xs font-medium text-kx-primary-600 bg-kx-primary-50 px-2.5 py-0.5 rounded-full">
            3 indexed
          </span>
        </div>
        <div className="space-y-2">
          {docs.map(d => (
            <div
              key={d.name}
              className="flex items-center justify-between bg-ledger-gray-50 rounded-xl px-4 py-2.5 border border-ledger-gray-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-kx-primary-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-kx-text-primary truncate">{d.name}</p>
                  <p className="text-xs text-ledger-gray-400">{d.meta}</p>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-3',
                  d.ok ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                )}
              >
                {d.ok && <CheckCircle className="w-3 h-3" />}
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Screen 2: Chat with case files ───────────────────────────────────────────
function ChatScreen() {
  return (
    <div className="flex h-full">
      <div className="w-36 border-r border-ledger-gray-100 p-3 shrink-0 bg-ledger-gray-50/50">
        <p className="text-xs font-semibold text-ledger-gray-400 uppercase tracking-wide mb-3">Documents</p>
        {['FIR_Sharma.pdf', 'BailApp.pdf', 'Chargesheet.pdf'].map(d => (
          <div key={d} className="flex items-center gap-1.5 py-1.5">
            <FileText className="w-3 h-3 text-kx-primary-400 shrink-0" />
            <span className="text-xs text-kx-text-secondary truncate">{d}</span>
            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-hidden">
        <div className="flex justify-end">
          <div className="bg-kx-primary-600 text-white text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
            Summarise this case briefly
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="bg-ledger-gray-50 border border-ledger-gray-100 text-kx-text-primary text-xs rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[95%] leading-relaxed">
            Bail matter under Sec 138 NI Act. Mr. Sharma allegedly issued a cheque of ₹4.5L that was dishonoured. No prior record. Hearing tomorrow at Bombay HC, Court 7.
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="text-xs text-ledger-gray-400">Cited from <span className="font-medium text-kx-text-secondary">BailApp.pdf</span>, pg. 2</span>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-kx-primary-600 text-white text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
            Draft a bail application for this case
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 3: Judgments library ──────────────────────────────────────────────
function JudgmentsScreen() {
  const rows = [
    { citation: '2026 INSC 394', title: 'State of UP', versus: 'Ajay Kumar Malik', verdict: 'Appeal Allowed', ok: true },
    { citation: '2026 INSC 392', title: 'Balaji', versus: 'Maharashtra RTC', verdict: 'Appeal Allowed', ok: true },
    { citation: '2026 INSC 390', title: 'Nilesh Ojha', versus: 'HC Bombay', verdict: 'Appeal Dismissed', ok: false },
    { citation: '2026 INSC 389', title: 'Pawan Garg', versus: 'South Delhi MC', verdict: 'Appeal Allowed', ok: true },
  ]
  return (
    <div className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-kx-primary-600" />
          <span className="text-sm font-semibold text-kx-text-primary">Judgments Library</span>
        </div>
        <span className="text-xs font-medium text-kx-primary-600 bg-kx-primary-50 px-2.5 py-0.5 rounded-full">
          7 Lakh+ indexed
        </span>
      </div>
      <div className="divide-y divide-ledger-gray-100">
        {rows.map(j => (
          <div key={j.citation} className="flex items-center gap-3 py-2.5">
            <span className="text-[10px] font-mono font-semibold text-kx-primary-700 bg-kx-primary-50 px-2 py-1 rounded shrink-0">
              {j.citation}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-kx-text-primary truncate">
                {j.title} <span className="text-ledger-gray-400 italic font-normal">v.</span> {j.versus}
              </p>
              <p className="text-xs text-ledger-gray-400">Supreme Court · 20 Apr 2026</p>
            </div>
            <span
              className={cn(
                'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                j.ok ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
              )}
            >
              {j.verdict}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screen 4: Translate draft ────────────────────────────────────────────────
function TranslateScreen() {
  const enParas = [
    'The applicant respectfully submits that he has been falsely implicated in FIR No. 142/2026 dated 14.03.2026 registered at P.S. Andheri under Section 138 of the Negotiable Instruments Act.',
    'The applicant has no prior criminal antecedents and has cooperated fully with the investigation, appearing before the I.O. on every occasion summoned.',
    'The alleged dishonour of cheque No. 045632 for ₹4,50,000 was a result of a bona fide banking error and not on account of any mala fide intention.',
    'It is therefore prayed that bail be granted to the applicant on such terms as this Hon’ble Court may deem fit.',
  ]
  const hiParas = [
    'आवेदक सादर निवेदन करता है कि उसे एफ.आई.आर. संख्या 142/2026 दिनांक 14.03.2026, थाना अंधेरी में धारा 138 परक्राम्य लिखत अधिनियम के अंतर्गत झूठा फंसाया गया है।',
    'आवेदक का कोई पूर्व आपराधिक रिकॉर्ड नहीं है और उसने जांच में पूरा सहयोग किया है, तथा प्रत्येक अवसर पर अन्वेषण अधिकारी के समक्ष उपस्थित हुआ है।',
    'चेक संख्या 045632, राशि ₹4,50,000 का कथित अनादरण एक सद्भावपूर्ण बैंकिंग त्रुटि का परिणाम था, न कि किसी दुर्भावनापूर्ण आशय का।',
    'अतः प्रार्थना है कि इस माननीय न्यायालय द्वारा उचित शर्तों पर आवेदक को जमानत प्रदान की जाए।',
  ]
  return (
    <div className="p-4 h-full overflow-hidden relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-kx-primary-600" />
          <span className="text-sm font-semibold text-kx-text-primary">Translate draft</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Translated in 8s
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2 text-xs">
        <span className="text-kx-text-secondary font-medium">English</span>
        <ArrowRight className="w-3 h-3 text-ledger-gray-400" />
        <span className="text-kx-primary-700 font-medium">हिन्दी (Hindi)</span>
        <span className="ml-auto text-[10px] text-ledger-gray-400">+9 more languages</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-ledger-gray-50 border border-ledger-gray-100 rounded-xl p-3 space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-ledger-gray-400">English</p>
          {enParas.map((t, i) => (
            <p key={i} className="text-[10px] text-kx-text-secondary leading-relaxed">{t}</p>
          ))}
        </div>
        <div className="bg-kx-primary-50/40 border border-kx-primary-100 rounded-xl p-3 space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-kx-primary-600">हिन्दी</p>
          {hiParas.map((t, i) => (
            <p key={i} className="text-[10px] text-kx-text-primary leading-relaxed">{t}</p>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  )
}

// ─── Screen 5: Draft generated ────────────────────────────────────────────────
function DraftScreen() {
  return (
    <div className="p-4 h-full overflow-hidden relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-kx-text-primary">Bail Application — Draft</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Generated in 52s
        </span>
      </div>
      <div className="font-serif text-kx-text-primary space-y-1.5 leading-snug text-[10px]">
        <p className="text-center font-bold uppercase tracking-wide">IN THE HON&rsquo;BLE COURT OF SESSIONS</p>
        <p className="text-center text-[9px] text-ledger-gray-400">Greater Mumbai · Crl. Misc. App. No. 142/2026</p>
        <div className="flex justify-between pt-1">
          <span className="font-semibold">Ramesh Sharma</span>
          <span className="text-ledger-gray-400 italic">…Applicant</span>
        </div>
        <p className="text-center text-[9px] text-ledger-gray-400">versus</p>
        <div className="flex justify-between">
          <span className="font-semibold">State of Maharashtra</span>
          <span className="text-ledger-gray-400 italic">…Respondent</span>
        </div>
        <p className="font-semibold pt-1">APPLICATION FOR BAIL UNDER SECTION 437 CrPC</p>
        <p className="text-kx-text-secondary">
          <span className="font-semibold text-kx-text-primary">1.</span> The applicant respectfully submits that he has been falsely implicated in FIR No. 142/2026 dated 14.03.2026 registered at P.S. Andheri under Section 138 NI Act.
        </p>
        <p className="text-kx-text-secondary">
          <span className="font-semibold text-kx-text-primary">2.</span> The applicant has no prior criminal antecedents and has cooperated fully with the investigation, appearing before the I.O. on every occasion summoned.
        </p>
        <p className="text-kx-text-secondary">
          <span className="font-semibold text-kx-text-primary">3.</span> The alleged dishonour of cheque No. 045632 for ₹4,50,000 was a result of a bona fide banking error, not mala fide intent.
        </p>
        <p className="text-kx-text-secondary">
          <span className="font-semibold text-kx-text-primary">PRAYER:</span> It is therefore prayed that this Hon&rsquo;ble Court be pleased to grant bail to the applicant on such terms as deemed fit.
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  )
}

const SCREENS = [
  { label: 'Case workspace', Component: CaseDashboardScreen },
  { label: 'Chat with case files', Component: ChatScreen },
  { label: 'Judgments', Component: JudgmentsScreen },
  { label: 'Translate', Component: TranslateScreen },
  { label: 'Draft generated', Component: DraftScreen },
]

const STEP_DURATION = 4200

// ─── Demo frame ───────────────────────────────────────────────────────────────
// Wraps the browser chrome and 16:10 content slot. Swap `children` for a <video>
// when a product video is ready — layout and sizing stay identical.
function DemoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-ledger-gray-200 shadow-[0_20px_50px_-20px_rgba(139,60,30,0.25)] overflow-hidden bg-white">
      <div className="bg-ledger-gray-50 border-b border-ledger-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 bg-white border border-ledger-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Lock className="w-3 h-3 text-ledger-gray-400 shrink-0" />
          <span className="text-xs text-ledger-gray-400 flex-1 text-center">dashboard.getknowlex.com</span>
        </div>
      </div>
      <div className="aspect-[16/10] overflow-hidden relative">{children}</div>
    </div>
  )
}

function ProductDemo({ reduceMotion }: { reduceMotion: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const id = setTimeout(() => {
      setStep(s => (s + 1) % SCREENS.length)
    }, STEP_DURATION)
    return () => clearTimeout(id)
  }, [step, reduceMotion])

  const { Component } = SCREENS[step]

  return (
    <div className="w-full">
      <DemoFrame>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="absolute inset-0"
          >
            <Component />
          </motion.div>
        </AnimatePresence>
      </DemoFrame>

      <div className="mt-3">
        <div className="flex items-center justify-center gap-7 border-b border-ledger-gray-100">
          {SCREENS.map(({ label }, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={cn(
                'pb-2 text-xs font-medium transition-all duration-200 border-b-2 -mb-px',
                i === step
                  ? 'text-kx-primary-700 border-kx-primary-600'
                  : 'text-ledger-gray-400 border-transparent hover:text-kx-text-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
export function HeroSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center py-12 lg:py-0 bg-[#fdf8f4] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #8B3A1E 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left — text + CTAs */}
          <div className="lg:col-span-5">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' as const }}
              className="text-xs font-semibold tracking-[0.22em] uppercase text-kx-primary-600 mb-5"
            >
              AI workspace for Indian advocates
            </motion.p>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' as const, delay: 0.08 }}
              className="font-serif font-semibold text-kx-text-primary leading-[1.1] tracking-tight text-4xl sm:text-[2.75rem] lg:text-5xl"
            >
              Your entire practice
              <br className="hidden sm:block" /> in one <span className="text-kx-primary-800">platform</span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' as const }}
              className="mt-5 text-lg text-kx-text-secondary leading-relaxed max-w-lg"
            >
              Draft, manage cases, and research precedents — grounded in 7 Lakh+ Supreme Court &amp; High Court judgments
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: 'easeOut' as const }}
              className="flex flex-wrap gap-3 mt-8"
            >
              <motion.button
                whileHover={reduceMotion ? undefined : { y: -2, boxShadow: '0 14px 30px -10px rgba(139,60,30,0.35)' }}
                whileTap={reduceMotion ? undefined : { y: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => goToDashboard('/login')}
                className="inline-flex items-center gap-2 text-base font-semibold bg-kx-primary-800 text-white rounded-full px-7 py-3 hover:bg-kx-primary-900 transition-colors"
              >
                Try for Free <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { y: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => window.open(CALENDLY_URL, '_blank')}
                className="text-base font-semibold text-kx-text-primary border border-kx-primary-200 rounded-full px-7 py-3 hover:bg-kx-primary-50 hover:border-kx-primary-300 transition-colors"
              >
                Book a Demo
              </motion.button>
            </motion.div>

            {/* Qualifier row */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' as const }}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-kx-text-secondary"
            >
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-kx-primary-600" />
                End-to-end encrypted
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-kx-primary-600" />
                Built for Indian courts
              </span>
            </motion.div>
          </div>

          {/* Right — animated demo */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' as const }}
            className="lg:col-span-7"
          >
            <ProductDemo reduceMotion={!!reduceMotion} />
          </motion.div>

        </div>
      </div>
    </section>
  )
}

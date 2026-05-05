import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'

const GENERATING_PHRASES: Record<string, string[]> = {
  Translation: ['Translating document…', 'Converting language…', 'Reviewing translation…', 'Almost there…'],
  Draft:       ['Analysing case details…', 'Drafting legal content…', 'Reviewing structure…', 'Finalising document…'],
  Summary:     ['Reading document…', 'Extracting key points…', 'Composing summary…'],
  Synopsis:    ['Processing document…', 'Building synopsis…', 'Finalising…'],
  default:     ['Processing…', 'Working on it…', 'Almost ready…'],
}

export function GeneratingState({ label }: { label: string }) {
  const phrases = GENERATING_PHRASES[label] ?? GENERATING_PHRASES.default
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    const target = phrases[phraseIdx]
    if (typing) {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 38)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setTyping(false), 1600)
        return () => clearTimeout(t)
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 18)
        return () => clearTimeout(t)
      } else {
        setPhraseIdx(i => (i + 1) % phrases.length)
        setTyping(true)
      }
    }
  }, [displayed, typing, phraseIdx, phrases])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 bg-kx-surface">
      {/* Animated ring */}
      <div className="relative flex items-center justify-center h-16 w-16">
        <svg className="animate-spin absolute inset-0 h-16 w-16 text-kx-primary-200" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
          <path d="M32 4 a28 28 0 0 1 28 28" stroke="var(--color-kx-primary-600)" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <FileText className="h-6 w-6 text-kx-primary-600" />
      </div>

      {/* Typewriter text */}
      <div className="text-center space-y-2">
        <p className="text-base font-semibold text-kx-primary-900">Generating {label}</p>
        <p className="text-sm text-kx-primary-600 font-medium min-h-[1.5rem]">
          {displayed}<span className="animate-pulse opacity-70">|</span>
        </p>
        <p className="text-xs text-ledger-gray-400">This usually takes 1–2 minutes</p>
      </div>

      {/* Fake document preview */}
      <div className="w-full max-w-lg bg-white dark:bg-ledger-gray-800 border border-ledger-gray-100 dark:border-ledger-gray-700 rounded-xl shadow-sm p-6 space-y-4">
        {[
          { w: 55, lines: [100, 92, 78] },
          { w: 40, lines: [100, 88, 95, 60] },
          { w: 48, lines: [100, 85, 72] },
        ].map((s, si) => (
          <div key={si} className="space-y-1.5">
            <div className="h-2.5 rounded-full bg-kx-primary-100 dark:bg-kx-primary-900/40 animate-pulse" style={{ width: `${s.w}%`, animationDelay: `${si * 0.2}s` }} />
            {s.lines.map((w, li) => (
              <div key={li} className="h-2 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-700 animate-pulse" style={{ width: `${w}%`, animationDelay: `${(si * 3 + li) * 0.07}s` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

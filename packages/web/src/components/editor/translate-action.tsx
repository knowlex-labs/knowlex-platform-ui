import { useState } from 'react'
import { Languages } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { translateText } from '@knowlex/core/api'
import { cn } from '@/lib/utils'

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
]

interface TranslateActionProps {
  editor: Editor | null
}

/**
 * Toolbar button that translates the current selection via Sarvam and replaces
 * the selected range with the translated text. No-op if nothing is selected.
 */
export function TranslateAction({ editor }: TranslateActionProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!editor) return null

  const runTranslate = async (target: string) => {
    setOpen(false)
    setError(null)
    const { from, to, empty } = editor.state.selection
    if (empty) {
      setError('Select some text to translate')
      return
    }
    const text = editor.state.doc.textBetween(from, to, '\n')
    if (!text.trim()) return

    setBusy(true)
    try {
      // Sarvam auto-detects when source is unspecified; we send 'auto' marker.
      const result = await translateText(text, 'auto', target)
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(result.translatedText)
        .run()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Translation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
          'text-ledger-gray-600 hover:bg-ledger-gray-100',
          busy && 'opacity-60 cursor-wait',
        )}
        title="Translate selection"
      >
        <Languages className="h-3.5 w-3.5" />
        {busy ? 'Translating…' : 'Translate'}
      </button>
      {open && !busy && (
        <div className="absolute right-0 mt-1 z-50 min-w-[180px] rounded-md border border-ledger-gray-200 bg-white shadow-lg py-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => runTranslate(lang.code)}
              className="w-full text-left px-3 py-1.5 text-xs text-ledger-gray-700 hover:bg-ledger-gray-100"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <span className="absolute right-0 mt-1 text-[11px] text-red-600 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  )
}

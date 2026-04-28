import { useState } from 'react'
import { IndicTransliterate } from '@ai4bharat/indic-transliterate'
import { Languages, X } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'

const LANGS = [
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
] as const

type LangCode = (typeof LANGS)[number]['code']

interface TransliteratePanelProps {
  editor: Editor | null
  onClose: () => void
}

/**
 * Docked input panel for WhatsApp-style transliteration. The user types roman
 * characters here; AI4Bharat's `IndicTransliterate` shows live Devanagari (or
 * other Indic script) suggestions; pressing Cmd/Ctrl-Enter inserts the active
 * line at the editor cursor and clears the input.
 *
 * We route input through this panel rather than wiring the Tiptap editable
 * surface directly because AI4Bharat's component owns its own keystroke flow
 * and suggestion popup — wedging that inside ProseMirror would mean
 * reimplementing the popup.
 */
export function TransliteratePanel({ editor, onClose }: TransliteratePanelProps) {
  const [lang, setLang] = useState<LangCode>('hi')
  const [text, setText] = useState('')

  if (!editor) return null

  const insertAndClear = () => {
    if (!text.trim()) return
    editor.chain().focus().insertContent(text).run()
    setText('')
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-40 w-[360px] rounded-lg border border-ledger-gray-200',
        'bg-white shadow-2xl',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-ledger-gray-200">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ledger-gray-700">
          <Languages className="h-3.5 w-3.5" />
          Type in {LANGS.find((l) => l.code === lang)?.label ?? 'Hindi'}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-ledger-gray-500 hover:text-ledger-gray-800"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 py-2 flex flex-wrap gap-1">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
              lang === l.code
                ? 'bg-kx-primary-100 text-kx-primary-800'
                : 'text-ledger-gray-600 hover:bg-ledger-gray-100',
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="p-3 pt-0">
        <IndicTransliterate
          value={text}
          onChangeText={(v: string) => setText(v)}
          lang={lang}
          renderComponent={(props: Record<string, unknown>) => (
            <textarea
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
              rows={3}
              placeholder="Type in roman, e.g. 'namaste' → नमस्ते"
              className="w-full text-sm px-2 py-1.5 border border-ledger-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  insertAndClear()
                }
              }}
            />
          )}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-ledger-gray-500">
            ⌘ / Ctrl + Enter to insert
          </span>
          <button
            type="button"
            onClick={insertAndClear}
            disabled={!text.trim()}
            className={cn(
              'px-3 py-1 rounded text-xs font-medium transition-colors',
              'bg-kx-primary-600 text-white hover:bg-kx-primary-700',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  )
}

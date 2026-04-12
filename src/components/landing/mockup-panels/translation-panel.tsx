import { Languages, ArrowRight, CheckCircle2 } from 'lucide-react'

const sourceLines = [
  'The applicant respectfully submits that the',
  'impugned order dated 12.01.2026 passed by',
  'the Learned Sessions Judge is contrary to',
  'the settled principles of law...',
]

const translatedLines = [
  'आवेदक सविनय निवेदन करता है कि दिनांक',
  '12.01.2026 को विद्वान सत्र न्यायाधीश',
  'द्वारा पारित विवादित आदेश विधि के',
  'स्थापित सिद्धांतों के विरुद्ध है...',
]

export function TranslationPanel() {
  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center">
          <Languages className="w-3 h-3 text-teal-700" />
        </div>
        <span className="text-[10px] font-semibold text-kx-primary-950">Translate Document</span>
        <span className="ml-auto flex items-center gap-1 text-[8px] text-emerald-600 font-medium bg-emerald-50 rounded-full px-1.5 py-0.5">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Done
        </span>
      </div>

      {/* Language pill */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[9px] font-medium text-ledger-gray-600 bg-ledger-gray-100 px-2 py-0.5 rounded-full">English</span>
        <ArrowRight className="w-3 h-3 text-ledger-gray-400" />
        <span className="text-[9px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Hindi</span>
      </div>

      {/* Before / After columns */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Source */}
        <div className="flex-1 bg-ledger-gray-50 rounded-lg p-2 overflow-hidden">
          <p className="text-[8px] font-semibold text-ledger-gray-400 uppercase tracking-wider mb-1.5">Source</p>
          <div className="space-y-1">
            {sourceLines.map((line, i) => (
              <p key={i} className="text-[8px] text-ledger-gray-600 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>

        {/* Translated */}
        <div className="flex-1 bg-teal-50/60 rounded-lg p-2 overflow-hidden border border-teal-100">
          <p className="text-[8px] font-semibold text-teal-500 uppercase tracking-wider mb-1.5">Translation</p>
          <div className="space-y-1">
            {translatedLines.map((line, i) => (
              <p key={i} className="text-[8px] text-kx-primary-950 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Model badge */}
      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="text-[7px] text-ledger-gray-400">Powered by</span>
        <span className="text-[7px] font-semibold text-ledger-gray-500 bg-ledger-gray-100 px-1.5 py-0.5 rounded">Gemini</span>
      </div>
    </div>
  )
}

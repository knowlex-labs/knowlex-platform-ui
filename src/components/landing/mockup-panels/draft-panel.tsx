import { Bold, Italic, Underline, Wand2 } from 'lucide-react'

interface DraftPanelProps {
  imageSrc?: string
}

export function DraftPanel({ imageSrc }: DraftPanelProps) {
  if (imageSrc) {
    return <img src={imageSrc} alt="Draft editor" className="w-full h-full object-cover rounded-lg" />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-ledger-gray-200 bg-ledger-white">
        <button className="p-1 rounded hover:bg-ledger-gray-100">
          <Bold className="w-3 h-3 text-ledger-gray-500" />
        </button>
        <button className="p-1 rounded hover:bg-ledger-gray-100">
          <Italic className="w-3 h-3 text-ledger-gray-500" />
        </button>
        <button className="p-1 rounded hover:bg-ledger-gray-100">
          <Underline className="w-3 h-3 text-ledger-gray-500" />
        </button>
        <div className="w-px h-3.5 bg-ledger-gray-200 mx-1" />
        <span className="text-[9px] text-ledger-gray-400 px-1.5 py-0.5 border border-ledger-gray-200 rounded">12pt</span>
      </div>

      {/* Document body — serif font like the actual editor */}
      <div className="flex-1 px-6 py-4 overflow-hidden relative bg-ledger-white">
        <div className="space-y-2 text-[10px] leading-[1.8] text-ledger-gray-700" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          <p className="text-center font-bold text-[11px]">IN THE COURT OF SESSIONS JUDGE, MUMBAI</p>
          <p className="text-center text-ledger-gray-400 text-[9px]">Criminal Misc. Application No. ___/2026</p>
          <div className="pt-2">
            <p>
              The applicant herein is seeking regular bail in connection with
              FIR No. 142/2026 registered at P.S. Andheri under Sections 420, 467,
              468 and 471 of the Indian Penal Code, 1860.
            </p>
            <p className="mt-2">
              It is respectfully submitted that the applicant is a permanent
              resident of Mumbai and has deep roots in the community...
            </p>
          </div>
          <span className="inline-block w-[2px] h-3 bg-kx-primary-500 animate-blink" />
        </div>
        {/* Floating AI button */}
        <div className="absolute top-12 right-4">
          <div className="flex items-center gap-1 bg-kx-primary-600 text-white rounded px-1.5 py-0.5 shadow-sm">
            <Wand2 className="w-2.5 h-2.5" />
            <span className="text-[8px] font-medium">Fix with AI</span>
          </div>
        </div>
        {/* Gradient fade */}
        <div className="absolute bottom-6 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-ledger-gray-200 bg-ledger-gray-50 flex items-center justify-between">
        <span className="text-[8px] text-ledger-gray-400">Last saved: just now</span>
        <span className="text-[8px] text-ledger-gray-400">
          <span className="font-medium">Ctrl+S</span> to save
        </span>
      </div>
    </div>
  )
}

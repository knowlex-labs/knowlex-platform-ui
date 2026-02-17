import { Bot, User, Send } from 'lucide-react'

interface ResearchPanelProps {
  imageSrc?: string
}

export function ResearchPanel({ imageSrc }: ResearchPanelProps) {
  if (imageSrc) {
    return <img src={imageSrc} alt="Legal research" className="w-full h-full object-cover rounded-lg" />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat messages area */}
      <div className="flex-1 p-3 space-y-3 overflow-hidden">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[75%]">
            <div className="flex items-center justify-end gap-1 mb-0.5">
              <span className="text-[8px] text-ledger-gray-400">You</span>
              <User className="w-2.5 h-2.5 text-ledger-gray-400" />
            </div>
            <div className="rounded-xl rounded-br-sm bg-kx-primary-600 text-white px-2.5 py-1.5">
              <p className="text-[9px] leading-relaxed">What are the bail conditions for non-bailable offences?</p>
            </div>
          </div>
        </div>

        {/* AI response */}
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <Bot className="w-2.5 h-2.5 text-ledger-gray-400" />
            <span className="text-[8px] text-ledger-gray-400">Knowlex</span>
          </div>
          <div className="pl-0.5 text-[9px] text-kx-primary-900 leading-relaxed space-y-1.5">
            <p>
              Under Section 439 of CrPC, the High Court or Court of Session may grant bail in non-bailable offences considering:
            </p>
            <ul className="list-disc pl-3 space-y-0.5 text-ledger-gray-600">
              <li>Nature and gravity of the accusation</li>
              <li>Antecedents of the applicant</li>
              <li>Possibility of fleeing justice</li>
            </ul>
            <p className="text-ledger-gray-600">
              In <span className="font-medium text-kx-primary-600">Arnesh Kumar v. State of Bihar (2014) 8 SCC 273</span>, the Supreme Court laid down guidelines...
            </p>
          </div>
        </div>
      </div>

      {/* Chat input */}
      <div className="px-3 pb-2.5 pt-1">
        <div className="flex items-center gap-1.5 border border-ledger-gray-200 rounded-full px-2.5 py-1.5 bg-ledger-white shadow-sm">
          <input
            type="text"
            readOnly
            placeholder="Ask a legal question..."
            className="flex-1 bg-transparent text-[9px] text-ledger-gray-400 outline-none placeholder:text-ledger-gray-400"
          />
          <div className="h-5 w-5 rounded-full bg-kx-primary-600 flex items-center justify-center">
            <Send className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

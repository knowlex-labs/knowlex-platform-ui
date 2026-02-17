import { FolderOpen, User, Calendar } from 'lucide-react'

interface CaseListPanelProps {
  imageSrc?: string
}

const cases = [
  { name: 'Kumar v. State of Maharashtra', number: 'CR-2026-0142', client: 'Rajesh Kumar', status: 'Active', statusColor: 'bg-green-100 text-green-800', date: '12 Jan 2026' },
  { name: 'Sharma Family Trust', number: 'CV-2025-0891', client: 'Priya Sharma', status: 'Pending', statusColor: 'bg-yellow-100 text-yellow-800', date: '8 Feb 2026' },
  { name: 'Mehta & Co. v. SEBI', number: 'RG-2025-0334', client: 'Mehta & Co.', status: 'Appealed', statusColor: 'bg-blue-100 text-blue-800', date: '3 Dec 2025' },
  { name: 'Singh Property Dispute', number: 'CV-2024-1205', client: 'Harpreet Singh', status: 'Closed', statusColor: 'bg-ledger-gray-100 text-ledger-gray-800', date: '22 Nov 2025' },
]

export function CaseListPanel({ imageSrc }: CaseListPanelProps) {
  if (imageSrc) {
    return <img src={imageSrc} alt="Case list" className="w-full h-full object-cover rounded-lg" />
  }

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-kx-primary-900">Cases</span>
        <span className="text-[10px] text-ledger-gray-400">4 cases</span>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {cases.map((c) => (
          <div
            key={c.name}
            className="rounded-lg border border-ledger-gray-200 bg-ledger-white p-2.5 flex flex-col gap-1.5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start">
              <div className="h-7 w-7 rounded-md bg-kx-primary-50 flex items-center justify-center">
                <FolderOpen className="h-3.5 w-3.5 text-kx-primary-500" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-kx-primary-900 line-clamp-1">{c.name}</p>
              <p className="text-[8px] font-mono text-ledger-gray-400">{c.number}</p>
            </div>
            <div className="pt-1 border-t border-ledger-gray-100 space-y-0.5">
              <div className="flex items-center gap-1 text-[8px] text-ledger-gray-400">
                <User className="h-2.5 w-2.5" />
                <span className="truncate">{c.client}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[8px] text-ledger-gray-400">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{c.date}</span>
                </div>
                <span className={`text-[7px] px-1 py-0.5 rounded-sm font-medium ${c.statusColor}`}>
                  {c.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

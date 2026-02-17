import { Database, FileText, CheckCircle2 } from 'lucide-react'

const sources = [
  { label: 'Supreme Court', count: '28,400+', color: 'bg-indigo-500' },
  { label: 'High Courts', count: '18,200+', color: 'bg-violet-500' },
  { label: 'Tribunals', count: '3,400+', color: 'bg-amber-500' },
]

const recentDocs = [
  { name: 'Arnesh Kumar v. State of Bihar', status: 'indexed' },
  { name: 'K.S. Puttaswamy v. Union of India', status: 'indexed' },
  { name: 'Vishaka v. State of Rajasthan', status: 'indexed' },
]

export function KnowledgeBasePanel() {
  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-violet-100 flex items-center justify-center">
          <Database className="w-3 h-3 text-violet-600" />
        </div>
        <span className="text-[10px] font-semibold text-kx-primary-900">Knowledge Base</span>
        <span className="ml-auto text-[8px] text-emerald-600 font-medium bg-emerald-50 rounded-full px-1.5 py-0.5">Live</span>
      </div>

      {/* Source stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {sources.map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
            <div className={`w-1.5 h-1.5 rounded-full ${s.color} mx-auto mb-1`} />
            <span className="block text-[10px] font-bold text-kx-primary-900">{s.count}</span>
            <span className="block text-[7px] text-ledger-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Recent indexed */}
      <span className="text-[8px] font-medium text-ledger-gray-400 uppercase tracking-wider mb-1.5">Recently Indexed</span>
      <div className="space-y-1.5">
        {recentDocs.map((doc) => (
          <div key={doc.name} className="flex items-center gap-2 bg-gray-50/80 rounded-md px-2 py-1.5">
            <FileText className="w-3 h-3 text-ledger-gray-400 shrink-0" />
            <span className="text-[8px] text-kx-primary-900 truncate flex-1">{doc.name}</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

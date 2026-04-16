import { Home, Briefcase, Users, Sparkles } from 'lucide-react'
import { CaseListPanel } from './mockup-panels/case-list-panel'
import { DraftPanel } from './mockup-panels/draft-panel'

const sidebarIcons = [
  { icon: Home, label: 'Home' },
  { icon: Briefcase, label: 'Cases' },
  { icon: Users, label: 'Clients' },
  { icon: Sparkles, label: 'AI' },
]

export function DashboardMockup() {
  return (
    <div
      className="rounded-xl shadow-2xl overflow-hidden border border-gray-200/60 transition-transform duration-500 hover:scale-[1.01]"
      style={{
        transform: 'perspective(1200px) rotateY(-2deg) rotateX(1deg)',
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-kx-primary-950">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[11px] text-white/50 ml-2 font-medium">Knowlex</span>
      </div>

      {/* Content area */}
      <div className="flex bg-white h-[280px] sm:h-[320px]">
        {/* Sidebar */}
        <div className="w-12 bg-kx-primary-950 flex flex-col items-center pt-4 gap-4 shrink-0">
          {sidebarIcons.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-kx-primary-900 transition-colors"
              title={label}
            >
              <Icon className="w-4 h-4 text-orange-300" />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-w-0 divide-x divide-gray-100">
          <div className="w-[55%]">
            <CaseListPanel />
          </div>
          <div className="w-[45%]">
            <DraftPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

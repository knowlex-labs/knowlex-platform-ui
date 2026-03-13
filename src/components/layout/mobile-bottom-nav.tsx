import { Home, Briefcase, ClipboardList, Users, Scale } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'cases', label: 'Cases', icon: Briefcase, path: '/cases' },
  { id: 'cause-lists', label: 'Cause Lists', icon: ClipboardList, path: '/cause-lists' },
  { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
  { id: 'judgments', label: 'Judgments', icon: Scale, path: '/judgments' },
]

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-kx-card border-t border-kx-card-border safe-area-bottom">
      <div className="flex items-stretch h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors',
                isActive
                  ? 'text-kx-primary-600 border-t-2 border-kx-primary-600'
                  : 'text-ledger-gray-500 border-t-2 border-transparent'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

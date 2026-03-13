import { FolderOpen, FileText, Bot, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'

type MobilePanel = 'documents' | 'editor' | 'chat'

interface MobileWorkspaceToolbarProps {
  activePanel: MobilePanel
  onPanelChange: (panel: MobilePanel) => void
  onDraftingClick: () => void
}

const panels = [
  { id: 'documents' as const, label: 'Documents', icon: FolderOpen },
  { id: 'editor' as const, label: 'Editor', icon: FileText },
  { id: 'chat' as const, label: 'AI Chat', icon: Bot },
]

export function MobileWorkspaceToolbar({ activePanel, onPanelChange, onDraftingClick }: MobileWorkspaceToolbarProps) {
  return (
    <>
      {/* FAB - New Draft */}
      <button
        onClick={onDraftingClick}
        className="fixed bottom-20 right-4 z-30 md:hidden h-12 w-12 rounded-full bg-kx-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-kx-primary-700 active:bg-kx-primary-800 transition-colors"
        aria-label="New Draft"
      >
        <PenLine className="h-5 w-5" />
      </button>

      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-kx-card border-t border-kx-card-border safe-area-bottom">
        <div className="flex items-stretch h-14">
          {panels.map((panel) => {
            const Icon = panel.icon
            const isActive = activePanel === panel.id
            return (
              <button
                key={panel.id}
                onClick={() => onPanelChange(panel.id)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors',
                  isActive
                    ? 'text-kx-primary-600 border-t-2 border-kx-primary-600'
                    : 'text-ledger-gray-500 border-t-2 border-transparent'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{panel.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

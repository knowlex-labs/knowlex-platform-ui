import { PenLine, FileText, ListChecks, FileOutput } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderToolButtonsProps {
  onDraftingClick: () => void
}

const tools = [
  { id: 'drafting', name: 'Drafts', icon: PenLine, disabled: false },
  { id: 'summary', name: 'Summary', icon: FileText, disabled: true },
  { id: 'key-facts', name: 'Key Facts', icon: ListChecks, disabled: true },
  { id: 'report', name: 'Report', icon: FileOutput, disabled: true },
]

export function HeaderToolButtons({ onDraftingClick }: HeaderToolButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      {tools.map((tool) => {
        const Icon = tool.icon
        return (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            disabled={tool.disabled}
            onClick={tool.disabled ? undefined : onDraftingClick}
            className="h-8 px-3 gap-1.5 text-sm font-medium text-kx-primary-700 hover:text-kx-primary-800 disabled:opacity-40"
          >
            <Icon className="h-3.5 w-3.5" />
            {tool.name}
          </Button>
        )
      })}
    </div>
  )
}

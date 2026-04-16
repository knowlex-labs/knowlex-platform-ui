import { PenLine, FileText, Upload, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderToolButtonsProps {
  onDraftingClick: () => void
  onSummaryClick: () => void
  onUploadDocumentsClick: () => void
  onLinkJudgmentClick?: () => void
}

const tools = [
  { id: 'upload', name: 'Upload', icon: Upload, disabled: false, group: 'files' },
  { id: 'judgment', name: 'Judgment', icon: Scale, disabled: false, group: 'files' },
  { id: 'drafting', name: 'Drafts', icon: PenLine, disabled: false, group: 'generate' },
  { id: 'summary', name: 'Summary', icon: FileText, disabled: false, group: 'generate' },
]

export function HeaderToolButtons({ onDraftingClick, onSummaryClick, onUploadDocumentsClick, onLinkJudgmentClick }: HeaderToolButtonsProps) {
  const handleClick = (toolId: string) => {
    if (toolId === 'drafting') onDraftingClick()
    else if (toolId === 'summary') onSummaryClick()
    else if (toolId === 'upload') onUploadDocumentsClick()
    else if (toolId === 'judgment' && onLinkJudgmentClick) onLinkJudgmentClick()
  }

  return (
    <div className="flex items-center gap-1">
      {tools.map((tool, index) => {
        const Icon = tool.icon
        const prevTool = tools[index - 1]
        const showDivider = prevTool && prevTool.group !== tool.group
        return (
          <div key={tool.id} className="flex items-center">
            {showDivider && <div className="h-4 w-px bg-ledger-gray-200 mx-1" />}
            <Button
              variant="outline"
              size="sm"
              disabled={tool.disabled || (tool.id === 'judgment' && !onLinkJudgmentClick)}
              onClick={tool.disabled ? undefined : () => handleClick(tool.id)}
              className="h-8 px-3 gap-1.5 text-sm font-medium border-ledger-gray-200 text-kx-primary-700 hover:border-kx-primary-400 hover:bg-kx-primary-50 hover:text-kx-primary-800 disabled:opacity-40"
            >
              <Icon className="h-3.5 w-3.5" />
              {tool.name}
            </Button>
          </div>
        )
      })}
    </div>
  )
}

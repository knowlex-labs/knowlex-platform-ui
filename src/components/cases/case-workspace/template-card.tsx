import {
  FileWarning,
  Lightbulb,
  FileText,
  FileClock,
  Scale,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DraftTemplate } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  FileWarning,
  Lightbulb,
  FileText,
  FileClock,
  Scale,
}

interface TemplateCardProps {
  template: DraftTemplate
  onClick: () => void
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const Icon = ICON_MAP[template.icon] || FileText

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-2.5 p-4',
        'bg-ledger-white border border-ledger-gray-200 rounded-lg',
        'hover:border-ledger-black hover:shadow-md',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ledger-black',
        'aspect-square min-h-[120px]'
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-ledger-gray-50 flex items-center justify-center group-hover:bg-ledger-black transition-colors">
        <Icon className="h-6 w-6 text-ledger-gray-700 group-hover:text-ledger-white transition-colors" />
      </div>
      <span className="text-sm font-medium text-ledger-black text-center leading-tight">
        {template.name}
      </span>
    </button>
  )
}

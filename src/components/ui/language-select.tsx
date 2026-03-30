import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/select'

interface LanguageSelectProps {
  value: string
  onChange: (lang: string) => void
  className?: string
}

export function LanguageSelect({ value, onChange, className }: LanguageSelectProps) {
  return (
    <div className={cn('relative', className)}>
      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ledger-gray-400 pointer-events-none z-10" />
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 w-[140px]"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी (Hindi)</option>
      </Select>
    </div>
  )
}

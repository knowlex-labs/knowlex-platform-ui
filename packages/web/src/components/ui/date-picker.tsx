import { useState } from 'react'
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns'
import { CalendarDays, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

interface DatePickerProps {
  value?: string
  onChange: (date: string | undefined) => void
  placeholder?: string
  className?: string
  maxDate?: Date
  minDate?: Date
}

export function DatePicker({ value, onChange, placeholder = 'Select date', className, maxDate, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const parsed = value ? parseISO(value) : undefined
  const display = parsed ? format(parsed, 'dd MMM yyyy') : null

  const handleSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  const isDisabled = (date: Date) => {
    const d = startOfDay(date)
    if (maxDate && isAfter(d, startOfDay(maxDate))) return true
    if (minDate && isBefore(d, startOfDay(minDate))) return true
    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded border border-ledger-gray-300 bg-ledger-white px-3',
            'text-sm font-sans text-left transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-kx-primary-500 focus:ring-offset-1',
            display ? 'text-kx-primary-900' : 'text-ledger-gray-400',
            className
          )}
        >
          <span className="truncate">{display || placeholder}</span>
          <span className="flex items-center gap-1 ml-2 flex-shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="hover:text-kx-primary-700 text-ledger-gray-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <CalendarDays className="h-4 w-4 text-ledger-gray-500" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar selected={parsed} onSelect={handleSelect} disabled={isDisabled} />
      </PopoverContent>
    </Popover>
  )
}

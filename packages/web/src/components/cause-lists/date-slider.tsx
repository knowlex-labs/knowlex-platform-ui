import { useState, useEffect } from 'react'
import {
  format,
  parseISO,
  addDays,
  subDays,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

interface DateSliderProps {
  value: string
  onChange: (date: string) => void
  className?: string
}

const HALF = 3 // show 3 on each side of center = 7 total

export function DateSlider({ value, onChange, className }: DateSliderProps) {
  const selected = parseISO(value)
  const [centerDate, setCenterDate] = useState(selected)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Re-center when value changes externally
  useEffect(() => {
    const newSelected = parseISO(value)
    const start = subDays(centerDate, HALF)
    const end = addDays(centerDate, HALF)
    if (newSelected < start || newSelected > end) {
      setCenterDate(newSelected)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const dates = eachDayOfInterval({
    start: subDays(centerDate, HALF),
    end: addDays(centerDate, HALF),
  })

  const handleDateClick = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
  }

  const handleCalendarSelect = (date: Date) => {
    setCenterDate(date)
    onChange(format(date, 'yyyy-MM-dd'))
    setCalendarOpen(false)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Navigation row: selected date label + prev/next arrows */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setCenterDate(subDays(centerDate, 7))}
          className="h-9 w-9 rounded-full flex items-center justify-center border border-ledger-gray-300 hover:bg-ledger-gray-100 text-ledger-gray-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-kx-primary-900 min-w-[120px] text-center">
          {format(selected, 'EEE, d MMM')}
        </span>
        <button
          type="button"
          onClick={() => setCenterDate(addDays(centerDate, 7))}
          className="h-9 w-9 rounded-full flex items-center justify-center border border-ledger-gray-300 hover:bg-ledger-gray-100 text-ledger-gray-600 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Date cells strip */}
      <div className="flex rounded-xl border border-ledger-gray-200 bg-ledger-white overflow-hidden">
        {dates.map((date, i) => {
          const isSelected = isSameDay(date, selected)
          const isNow = isToday(date)

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDateClick(date)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 text-center transition-colors relative',
                i > 0 && 'border-l border-ledger-gray-200',
                isSelected
                  ? 'bg-kx-primary-800 text-white'
                  : 'hover:bg-ledger-gray-50 text-ledger-gray-700'
              )}
            >
              <span className={cn(
                'text-sm font-medium',
                isSelected ? 'text-white' : 'text-kx-primary-900'
              )}>
                {format(date, 'd MMM')}
              </span>
              <span className={cn(
                'text-xs mt-0.5',
                isSelected ? 'text-white/70' : isNow ? 'text-kx-primary-600 font-medium' : 'text-ledger-gray-400'
              )}>
                {isNow ? 'Today' : format(date, 'EEE')}
              </span>
            </button>
          )
        })}

        {/* Flexible dates cell — opens calendar */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 flex flex-col items-center justify-center py-3 border-l border-ledger-gray-200 text-ledger-gray-500 hover:bg-ledger-gray-50 transition-colors"
            >
              <CalendarDays className="h-5 w-5 mb-0.5" />
              <span className="text-xs">Pick date</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-3">
            <Calendar selected={selected} onSelect={handleCalendarSelect} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

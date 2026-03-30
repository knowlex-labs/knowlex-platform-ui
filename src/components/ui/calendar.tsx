import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarProps {
  selected?: Date
  onSelect: (date: Date) => void
  className?: string
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date())

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className={cn('w-[280px]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-ledger-gray-100 text-ledger-gray-500 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-kx-primary-900">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-ledger-gray-100 text-ledger-gray-500 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-ledger-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false
          const isCurrentMonth = isSameMonth(day, viewMonth)
          const isNow = isToday(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                'h-8 w-8 mx-auto rounded-full text-sm flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-kx-primary-600 text-white font-medium'
                  : isNow
                    ? 'ring-1 ring-kx-primary-300 text-kx-primary-700 hover:bg-kx-primary-50'
                    : isCurrentMonth
                      ? 'text-ledger-gray-700 hover:bg-ledger-gray-100'
                      : 'text-ledger-gray-300 hover:bg-ledger-gray-50'
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

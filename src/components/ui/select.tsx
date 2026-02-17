import * as React from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  searchable?: boolean
  searchPlaceholder?: string
}

interface OptionData {
  value: string
  label: string
  disabled?: boolean
}

function extractOptions(children: React.ReactNode): OptionData[] {
  const options: OptionData[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>
      options.push({
        value: String(props.value ?? ''),
        label: String(props.children ?? ''),
        disabled: props.disabled,
      })
    }
  })
  return options
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, onChange, disabled, id, name, searchable, searchPlaceholder, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const containerRef = React.useRef<HTMLDivElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    const hiddenRef = React.useRef<HTMLSelectElement>(null)

    React.useImperativeHandle(ref, () => hiddenRef.current as HTMLSelectElement)

    const options = extractOptions(children)
    const selectedOption = options.find((o) => o.value === String(value ?? ''))
    const displayLabel = selectedOption?.label ?? ''

    // Filter options when searchable
    const filteredOptions = searchable && search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options

    // Auto-scroll dropdown into view & focus search input when opened
    React.useEffect(() => {
      if (!open) {
        setSearch('')
        return
      }
      // Small delay to let the dropdown render
      requestAnimationFrame(() => {
        dropdownRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        if (searchable) {
          searchInputRef.current?.focus()
        }
      })
    }, [open, searchable])

    // Close on click outside
    React.useEffect(() => {
      if (!open) return
      const handleClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    // Close on Escape
    React.useEffect(() => {
      if (!open) return
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false)
      }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }, [open])

    const handleSelect = (optionValue: string) => {
      if (disabled) return
      setOpen(false)

      if (onChange && hiddenRef.current) {
        hiddenRef.current.value = optionValue
        const event = new Event('change', { bubbles: true })
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { value: optionValue, name: name ?? '', id: id ?? '' },
        })
        onChange(event as unknown as React.ChangeEvent<HTMLSelectElement>)
      }
    }

    return (
      <div ref={containerRef} className="relative">
        {/* Hidden native select for form compatibility */}
        <select
          ref={hiddenRef}
          id={id}
          name={name}
          value={String(value ?? '')}
          onChange={() => {}}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...props}
        >
          {children}
        </select>

        {/* Custom trigger */}
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded border border-ledger-gray-300 bg-ledger-white px-3 py-2',
            'text-sm font-sans text-kx-primary-900 text-left',
            'focus:outline-none focus:ring-2 focus:ring-kx-primary-500 focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            !selectedOption?.value && 'text-ledger-gray-400',
            className
          )}
        >
          <span className="truncate">{displayLabel || '\u00A0'}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-ledger-gray-500 flex-shrink-0 ml-2 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            ref={dropdownRef}
            role="listbox"
            className={cn(
              'absolute z-50 mt-1 w-full rounded border border-ledger-gray-200 bg-ledger-white shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-100'
            )}
          >
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-ledger-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ledger-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder ?? 'Search...'}
                    className={cn(
                      'w-full h-8 pl-8 pr-3 text-sm rounded border border-ledger-gray-200 bg-ledger-white',
                      'placeholder:text-ledger-gray-400 text-kx-primary-900',
                      'focus:outline-none focus:ring-1 focus:ring-kx-primary-500'
                    )}
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-ledger-gray-400 text-center">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === String(value ?? '')
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-sm text-left',
                        'transition-colors',
                        isSelected
                          ? 'bg-kx-primary-50 text-kx-primary-700 font-medium'
                          : 'text-ledger-gray-700 hover:bg-ledger-gray-50',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-3.5 w-3.5 flex-shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }

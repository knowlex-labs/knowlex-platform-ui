import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ledger-black focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'touch-manipulation',
          {
            'bg-ledger-black text-ledger-white hover:bg-ledger-gray-800':
              variant === 'primary',
            'bg-ledger-gray-100 text-ledger-black hover:bg-ledger-gray-200 border border-ledger-gray-300':
              variant === 'secondary',
            'bg-transparent text-ledger-black hover:bg-ledger-gray-100':
              variant === 'ghost',
            'bg-transparent text-ledger-black border border-ledger-black hover:bg-ledger-black hover:text-ledger-white':
              variant === 'outline',
          },
          {
            'h-10 min-h-[44px] px-3 text-sm rounded-sm': size === 'sm',
            'h-11 min-h-[44px] px-4 text-sm rounded': size === 'md',
            'h-12 min-h-[48px] px-6 text-base rounded': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }

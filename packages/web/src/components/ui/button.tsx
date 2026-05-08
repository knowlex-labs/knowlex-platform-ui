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
          'focus:outline-none focus:ring-2 focus:ring-kx-primary-500 focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'touch-manipulation',
          {
            'bg-kx-primary-600 text-white hover:bg-kx-primary-700':
              variant === 'primary',
            'bg-ledger-gray-100 text-kx-primary-900 hover:bg-ledger-gray-200 border border-ledger-gray-300':
              variant === 'secondary',
            'bg-transparent text-kx-primary-900 hover:bg-ledger-gray-100':
              variant === 'ghost',
            'bg-transparent text-kx-primary-700 border border-kx-primary-600 hover:bg-kx-primary-600 hover:text-white':
              variant === 'outline',
          },
          {
            'h-9 px-3 text-xs rounded-md': size === 'sm',
            'h-10 px-4 text-sm rounded-md': size === 'md',
            'h-11 px-6 text-base rounded-md': size === 'lg',
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

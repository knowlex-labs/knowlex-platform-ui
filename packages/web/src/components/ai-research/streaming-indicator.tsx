import { cn } from '@/lib/utils'

interface StreamingIndicatorProps {
  className?: string
}

export function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-ledger-gray-400 text-sm', className)}>
      <span>Thinking</span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-ledger-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-ledger-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-ledger-gray-400 animate-bounce [animation-delay:300ms]" />
      </span>
    </span>
  )
}

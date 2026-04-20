export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-kx-primary-400 animate-bounce [animation-delay:0ms] [animation-duration:1s]" />
        <span className="h-2 w-2 rounded-full bg-kx-primary-400 animate-bounce [animation-delay:200ms] [animation-duration:1s]" />
        <span className="h-2 w-2 rounded-full bg-kx-primary-400 animate-bounce [animation-delay:400ms] [animation-duration:1s]" />
      </div>
      <span className="text-xs text-ledger-gray-400 animate-pulse">Thinking…</span>
    </div>
  )
}

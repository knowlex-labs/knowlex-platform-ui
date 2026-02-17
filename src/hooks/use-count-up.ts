import { useEffect, useRef, useState } from 'react'

interface UseCountUpOptions {
  target: number
  duration?: number
  suffix?: string
  prefix?: string
}

export function useCountUp({ target, duration = 2000, suffix = '', prefix = '' }: UseCountUpOptions) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)
  const hasTriggered = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true
          observer.unobserve(element)

          const steps = 60
          const stepDuration = duration / steps
          let step = 0

          const interval = setInterval(() => {
            step++
            // Ease-out: faster at start, slower near end
            const progress = step / steps
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))

            if (step >= steps) {
              setValue(target)
              clearInterval(interval)
            }
          }, stepDuration)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [target, duration])

  const display = `${prefix}${value.toLocaleString()}${suffix}`

  return { ref, display }
}

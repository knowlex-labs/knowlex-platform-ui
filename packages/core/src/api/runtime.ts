import type { CoreAdapters } from './ports'

let adapters: CoreAdapters | null = null

export function initCore(a: CoreAdapters): void {
  adapters = a
}

export function getAdapters(): CoreAdapters {
  if (!adapters) {
    throw new Error(
      '@knowlex/core has not been initialized. Call initCore() before using API services.'
    )
  }
  return adapters
}

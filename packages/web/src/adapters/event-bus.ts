import type { EventBusAdapter } from '@knowlex/core/api/ports'

export const browserEventBusAdapter: EventBusAdapter = {
  dispatch: (event, detail) => {
    window.dispatchEvent(new CustomEvent(event, { detail }))
  },
}

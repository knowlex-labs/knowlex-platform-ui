import type { EventBusAdapter } from '@knowlex/core/api/ports';

type Listener = (detail?: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

export const mobileEventBusAdapter: EventBusAdapter = {
  dispatch(event, detail) {
    const set = listeners.get(event);
    if (set) {
      set.forEach((fn) => fn(detail));
    }
  },
};

export function subscribe(event: string, cb: Listener): void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(cb);
}

export function unsubscribe(event: string, cb: Listener): void {
  listeners.get(event)?.delete(cb);
}

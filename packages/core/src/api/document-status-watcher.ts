import { workspaceApi, type CreateDocumentResponse } from './workspace-api'

/**
 * Multi-subscriber wrapper around `workspaceApi.pollDocumentStatus`.
 *
 * The drafting flow has three components that each need to watch the same
 * draft document's generation status:
 *   1. `RecentDraftsList` - polls every visible PROCESSING row so the
 *      status badge can flip.
 *   2. The global `DraftTracker` - polls every tracked job so the
 *      "Draft ready" toast fires on any authenticated route.
 *   3. `drafting-page` inline preview - polls the currently-pending doc
 *      so the editor mounts the moment generation finishes.
 *
 * Before this module, each of those opened its own `pollDocumentStatus`
 * call against the same `documentId`, so the API saw ~3 GETs per poll
 * tick. This module collapses them: the first subscriber for a given
 * `documentId` starts the underlying poll, subsequent subscribers attach
 * to it, and the poll only stops when the last subscriber leaves OR the
 * doc reaches a terminal state.
 *
 * Drop-in replacement at call sites:
 *   const ctrl = workspaceApi.pollDocumentStatus(id, cb)   // before
 *   return () => ctrl.abort()
 *
 *   const unsubscribe = subscribeDocumentStatus(id, cb)    // after
 *   return unsubscribe
 */

interface Subscriber {
  onStatus: (doc: CreateDocumentResponse) => void
  onError: (msg: string) => void
  onEnd: () => void
}

interface WatcherEntry {
  controller: AbortController
  subscribers: Set<Subscriber>
}

const watchers = new Map<string, WatcherEntry>()

export function subscribeDocumentStatus(
  documentId: string,
  subscriber: Subscriber,
): () => void {
  const existing = watchers.get(documentId)
  if (existing) {
    existing.subscribers.add(subscriber)
    return () => detach(documentId, subscriber)
  }

  // First subscriber - open the underlying poll once.
  const subscribers = new Set<Subscriber>([subscriber])
  const controller = workspaceApi.pollDocumentStatus(documentId, {
    onStatus: (doc) => {
      const entry = watchers.get(documentId)
      if (!entry) return
      // Snapshot subscribers before iterating so a callback that
      // synchronously unsubscribes doesn't mutate the Set we're walking.
      const snapshot = Array.from(entry.subscribers)
      for (const s of snapshot) s.onStatus(doc)
    },
    onError: (msg) => {
      const entry = watchers.get(documentId)
      if (!entry) return
      const snapshot = Array.from(entry.subscribers)
      for (const s of snapshot) s.onError(msg)
    },
    onEnd: () => {
      const entry = watchers.get(documentId)
      if (!entry) return
      const snapshot = Array.from(entry.subscribers)
      watchers.delete(documentId)
      for (const s of snapshot) s.onEnd()
    },
  })
  watchers.set(documentId, { controller, subscribers })
  return () => detach(documentId, subscriber)
}

function detach(documentId: string, subscriber: Subscriber): void {
  const entry = watchers.get(documentId)
  if (!entry) return
  entry.subscribers.delete(subscriber)
  if (entry.subscribers.size === 0) {
    entry.controller.abort()
    watchers.delete(documentId)
  }
}

/**
 * Module-scoped registry of drafts whose generation we want to surface a
 * completion toast for, no matter where the user navigates after submitting
 * the draft.
 *
 * The drafting page calls `trackJob(docId, label)` immediately after the
 * server returns the new draft id. A globally-mounted <DraftTracker />
 * component (see components/global/draft-tracker.tsx) subscribes to this
 * registry, opens an SSE stream per tracked id, and fires the
 * "Draft ready" toast on completion. The toast carries an Open action that
 * navigates back to /drafting?open=<docId>.
 *
 * This file is platform-agnostic (no React imports) so it can be reused if
 * mobile ever needs the same behaviour.
 */

type Listener = () => void

const trackedJobs = new Map<string, string>()
const listeners = new Set<Listener>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function trackJob(docId: string, label: string): void {
  trackedJobs.set(docId, label)
  emit()
}

export function untrackJob(docId: string): void {
  if (trackedJobs.delete(docId)) emit()
}

export function getTrackedJob(docId: string): string | undefined {
  return trackedJobs.get(docId)
}

export function getTrackedJobIds(): string[] {
  return Array.from(trackedJobs.keys())
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

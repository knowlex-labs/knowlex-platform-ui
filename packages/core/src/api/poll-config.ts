/**
 * Backoff configuration for document-generation status polling.
 *
 * Replaces the SSE-based status stream. The client polls
 * GET /api/v1/documents/{id}/status with the schedule below until
 * the document reaches a terminal state (COMPLETED / FAILED) or the
 * total elapsed time exceeds maxDurationMs.
 *
 * `initialDelayMs` is 5s because drafting takes 30-90s minimum (LLM
 * call + cause-title extraction + metadata extraction). A 1s first
 * poll just produces wasted GETs - and because three components
 * (RecentDraftsList row-watcher, the global DraftTracker, and the
 * drafting-page inline preview) can poll the same doc in parallel,
 * a tight first delay multiplied the GETs by ~3x in early seconds.
 */
interface PollConfig {
  initialDelayMs: number
  maxDelayMs: number
  backoffFactor: number
  maxDurationMs: number
}

export const POLL: PollConfig = {
  initialDelayMs: 5_000,
  maxDelayMs: 30_000,
  backoffFactor: 2,
  maxDurationMs: 10 * 60 * 1_000,
}

export function nextDelay(currentDelayMs: number): number {
  return Math.min(currentDelayMs * POLL.backoffFactor, POLL.maxDelayMs)
}

/**
 * Backoff configuration for document-generation status polling.
 *
 * Replaces the SSE-based status stream. The client polls
 * GET /api/v1/documents/{id}/status with the schedule below until
 * the document reaches a terminal state (COMPLETED / FAILED) or the
 * total elapsed time exceeds maxDurationMs.
 */
export const POLL = {
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  backoffFactor: 2,
  maxDurationMs: 10 * 60 * 1_000,
} as const

export function nextDelay(currentDelayMs: number): number {
  return Math.min(currentDelayMs * POLL.backoffFactor, POLL.maxDelayMs)
}

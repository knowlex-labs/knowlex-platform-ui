/**
 * Backoff configuration for document-generation status polling.
 *
 * Replaces the SSE-based status stream. The client polls
 * GET /api/v1/documents/{id}/status with the schedule below until
 * the document reaches a terminal state (COMPLETED / FAILED) or the
 * total elapsed time exceeds maxDurationMs.
 */
interface PollConfig {
  initialDelayMs: number
  maxDelayMs: number
  backoffFactor: number
  maxDurationMs: number
}

export const POLL: PollConfig = {
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  backoffFactor: 2,
  maxDurationMs: 10 * 60 * 1_000,
}

export function nextDelay(currentDelayMs: number): number {
  return Math.min(currentDelayMs * POLL.backoffFactor, POLL.maxDelayMs)
}

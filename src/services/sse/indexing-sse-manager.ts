/**
 * Singleton manager for SSE connections to monitor document indexing status
 * Uses fetch + ReadableStream because native EventSource doesn't support custom headers
 */
import { config } from '@/config/env'
import type { IndexingStatusEvent, IndexingStatus } from '@/types/sse.types'

const API_BASE_URL = config.apiBaseUrl

export interface IndexingStatusCallbacks {
  onStatusUpdate: (status: IndexingStatus) => void
  onError?: (error: string) => void
  onTerminal?: () => void
}

interface Subscription {
  documentId: string
  callbacks: IndexingStatusCallbacks
  controller: AbortController
  retryCount: number
  retryTimeoutId?: ReturnType<typeof setTimeout>
}

const MAX_RETRIES = 4
const RETRY_DELAYS = [1000, 2000, 4000, 8000] // Exponential backoff

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

function getUserId(): string | null {
  return localStorage.getItem('auth_user_id')
}

/**
 * Map SSE status to frontend IndexingStatus type
 */
function mapSseStatusToIndexingStatus(status: IndexingStatusEvent['status']): IndexingStatus | null {
  switch (status) {
    case 'INDEXING':
      return 'INDEXING'
    case 'INDEXED':
      return 'INDEXED'
    case 'INDEXING_FAILED':
    case 'ERROR':
    case 'NOT_FOUND':
      return 'INDEXING_FAILED'
    default:
      return null
  }
}

class IndexingSseManager {
  private subscriptions: Map<string, Subscription> = new Map()
  private sessionExpiredHandler: (() => void) | null = null

  constructor() {
    // Listen for session expired events to cleanup connections
    this.sessionExpiredHandler = () => this.unsubscribeAll()
    window.addEventListener('auth:session-expired', this.sessionExpiredHandler)
  }

  /**
   * Start monitoring a document's indexing status
   */
  subscribe(documentId: string, callbacks: IndexingStatusCallbacks): void {
    // If already subscribed, unsubscribe first
    if (this.subscriptions.has(documentId)) {
      this.unsubscribe(documentId)
    }

    const controller = new AbortController()
    const subscription: Subscription = {
      documentId,
      callbacks,
      controller,
      retryCount: 0,
    }

    this.subscriptions.set(documentId, subscription)
    this.startConnection(subscription)
  }

  /**
   * Stop monitoring a document
   */
  unsubscribe(documentId: string): void {
    const subscription = this.subscriptions.get(documentId)
    if (subscription) {
      subscription.controller.abort()
      if (subscription.retryTimeoutId) {
        clearTimeout(subscription.retryTimeoutId)
      }
      this.subscriptions.delete(documentId)
    }
  }

  /**
   * Stop all monitoring
   */
  unsubscribeAll(): void {
    for (const documentId of this.subscriptions.keys()) {
      this.unsubscribe(documentId)
    }
  }

  /**
   * Cleanup manager - call when component unmounts
   */
  destroy(): void {
    this.unsubscribeAll()
    if (this.sessionExpiredHandler) {
      window.removeEventListener('auth:session-expired', this.sessionExpiredHandler)
      this.sessionExpiredHandler = null
    }
  }

  private async startConnection(subscription: Subscription): Promise<void> {
    const { documentId, callbacks, controller } = subscription

    const token = getAuthToken()
    const userId = getUserId()

    if (!token || !userId) {
      callbacks.onError?.('Not authenticated')
      return
    }

    const url = `${API_BASE_URL}/api/v1/documents/${documentId}/indexing-status/stream`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:session-expired'))
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // Reset retry count on successful connection
      subscription.retryCount = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process complete events in buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonStr = line.slice(5).trim()
            if (jsonStr) {
              try {
                const event: IndexingStatusEvent = JSON.parse(jsonStr)
                this.handleEvent(subscription, event)
              } catch {
                // Ignore malformed JSON
              }
            }
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return // Intentionally aborted
      }

      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      callbacks.onError?.(errorMessage)

      // Retry with exponential backoff
      if (subscription.retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[subscription.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        subscription.retryCount++

        subscription.retryTimeoutId = setTimeout(() => {
          // Check if still subscribed
          if (this.subscriptions.has(documentId)) {
            // Create new controller for retry
            subscription.controller = new AbortController()
            this.startConnection(subscription)
          }
        }, delay)
      }
    }
  }

  private handleEvent(subscription: Subscription, event: IndexingStatusEvent): void {
    const { callbacks, documentId } = subscription

    const mappedStatus = mapSseStatusToIndexingStatus(event.status)
    if (mappedStatus) {
      callbacks.onStatusUpdate(mappedStatus)
    }

    if (event.error) {
      callbacks.onError?.(event.error)
    }

    if (event.terminal) {
      callbacks.onTerminal?.()
      // Auto-unsubscribe on terminal status
      this.unsubscribe(documentId)
    }
  }
}

// Singleton instance
export const indexingSseManager = new IndexingSseManager()

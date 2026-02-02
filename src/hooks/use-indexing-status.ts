import { useCallback, useEffect, useRef } from 'react'
import { indexingSseManager } from '@/services/sse'
import type { IndexingStatus } from '@/types/sse.types'

interface UseIndexingStatusOptions {
  onStatusUpdate: (documentId: string, status: IndexingStatus) => void
  onError?: (documentId: string, error: string) => void
}

interface UseIndexingStatusResult {
  subscribe: (documentId: string) => void
  unsubscribe: (documentId: string) => void
  unsubscribeAll: () => void
}

export function useIndexingStatus(options: UseIndexingStatusOptions): UseIndexingStatusResult {
  const { onStatusUpdate, onError } = options

  // Track subscribed document IDs for cleanup
  const subscribedIds = useRef<Set<string>>(new Set())

  const subscribe = useCallback((documentId: string) => {
    subscribedIds.current.add(documentId)

    indexingSseManager.subscribe(documentId, {
      onStatusUpdate: (status) => {
        onStatusUpdate(documentId, status)
      },
      onError: (error) => {
        onError?.(documentId, error)
      },
      onTerminal: () => {
        subscribedIds.current.delete(documentId)
      },
    })
  }, [onStatusUpdate, onError])

  const unsubscribe = useCallback((documentId: string) => {
    subscribedIds.current.delete(documentId)
    indexingSseManager.unsubscribe(documentId)
  }, [])

  const unsubscribeAll = useCallback(() => {
    for (const id of subscribedIds.current) {
      indexingSseManager.unsubscribe(id)
    }
    subscribedIds.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll()
    }
  }, [unsubscribeAll])

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
  }
}

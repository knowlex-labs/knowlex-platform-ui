/**
 * SSE (Server-Sent Events) type definitions for real-time updates
 */

export interface IndexingStatusEvent {
  documentId: string
  status: 'INDEXING' | 'INDEXED' | 'INDEXING_FAILED' | 'ERROR' | 'NOT_FOUND'
  previousStatus?: string
  chunkCount?: number
  error?: string
  timestamp: string
  terminal: boolean
}

export type IndexingStatus = 'INDEXING_PENDING' | 'INDEXING' | 'INDEXED' | 'INDEXING_FAILED'

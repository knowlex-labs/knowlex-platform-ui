import { useState, useEffect, useRef, useCallback } from 'react'
import { summaryApi } from '@/services/api/summary-api'
import type { CaseSummary } from '@/types'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 60

export function useSummary(caseId: string) {
  const [summary, setSummary] = useState<CaseSummary | null>(null)
  const [isLoading] = useState(false) // Summary fetch is synchronous; loading state not needed
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollAttemptsRef = useRef(0)

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    pollAttemptsRef.current = 0
  }, [])

  const fetchSummary = useCallback(async (): Promise<CaseSummary | null> => {
    try {
      const response = await summaryApi.get(caseId)
      if (response.data) {
        const raw = response.data
        const mapped: CaseSummary = {
          id: raw.id,
          status: raw.status === 'processing' ? 'pending' : raw.status,
          content: raw.content ?? '',
          createdAt: new Date(raw.created_at),
          updatedAt: new Date(raw.updated_at),
        }
        setSummary(mapped)
        return mapped
      }
    } catch {
      // 404 or other error means no summary exists yet
    }
    return null
  }, [caseId])

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return
    pollAttemptsRef.current = 0

    pollingIntervalRef.current = setInterval(async () => {
      pollAttemptsRef.current++

      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling()
        setIsGenerating(false)
        setSummary((prev) => prev ? { ...prev, status: 'failed' } : null)
        return
      }

      const current = await fetchSummary()
      if (current && (current.status === 'completed' || current.status === 'failed')) {
        stopPolling()
        setIsGenerating(false)
      }
    }, POLL_INTERVAL_MS)
  }, [fetchSummary, stopPolling])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const generateSummary = useCallback(async () => {
    setError(null)
    setIsGenerating(true)
    // Optimistic pending state
    setSummary((prev) =>
      prev
        ? { ...prev, status: 'pending', content: '' }
        : { id: 'pending', status: 'pending', content: '', createdAt: new Date(), updatedAt: new Date() }
    )
    try {
      await summaryApi.generate(caseId)
      startPolling()
    } catch {
      setIsGenerating(false)
      setError('Failed to generate summary. Please try again.')
      setSummary(null)
    }
  }, [caseId, startPolling])

  const deleteSummary = useCallback(async () => {
    try {
      await summaryApi.delete(caseId)
      setSummary(null)
    } catch {
      setError('Failed to delete summary.')
    }
  }, [caseId])

  return {
    summary,
    isLoading,
    isGenerating,
    error,
    fetchSummary,
    generateSummary,
    deleteSummary,
  }
}

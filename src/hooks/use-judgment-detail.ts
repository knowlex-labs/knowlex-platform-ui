import { useState, useCallback, useEffect } from 'react'
import { judgmentsApi } from '@/services/api/judgments-api'
import type { Judgment } from '@/types'

interface UseJudgmentDetailResult {
    judgment: Judgment | null
    pdfUrl: string | null
    isLoading: boolean
    isPdfLoading: boolean
    error: string | null
    refresh: () => void
}

export function useJudgmentDetail(judgmentId: string | null): UseJudgmentDetailResult {
    const [judgment, setJudgment] = useState<Judgment | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isPdfLoading, setIsPdfLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchJudgment = useCallback(async (id: string) => {
        setIsLoading(true)
        setError(null)
        setPdfUrl(null)
        try {
            const response = await judgmentsApi.get(id)
            const data = response.data
            setJudgment(data)

            // Fetch PDF URL if s3PdfKey exists (non-fatal)
            if (data.s3PdfKey) {
                setIsPdfLoading(true)
                try {
                    const url = await judgmentsApi.getPdfUrl(id)
                    setPdfUrl(url)
                } catch {
                    // PDF fetch is non-fatal
                    console.warn('Failed to fetch PDF URL for judgment:', id)
                } finally {
                    setIsPdfLoading(false)
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch judgment'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (judgmentId) {
            fetchJudgment(judgmentId)
        }
    }, [judgmentId, fetchJudgment])

    const refresh = useCallback(() => {
        if (judgmentId) {
            fetchJudgment(judgmentId)
        }
    }, [judgmentId, fetchJudgment])

    return { judgment, pdfUrl, isLoading, isPdfLoading, error, refresh }
}

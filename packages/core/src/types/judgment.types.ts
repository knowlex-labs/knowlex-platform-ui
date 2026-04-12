// Judgment types matching backend API response

export interface Judgment {
    id: string
    caseId: string
    title: string
    citation: string
    court: string
    decisionDate: string // ISO date YYYY-MM-DD
    year: number
    petitioner: string
    respondent: string
    judges: string[]
    authorJudge: string | null
    disposalNature: string | null
    description: string | null
    s3PdfKey: string | null
    createdAt: string
    updatedAt: string
}

export interface JudgmentFilters {
    search?: string
    court?: string
    judge?: string
    year?: number
    month?: number
    disposalNature?: string[]
    dateFrom?: string
    dateTo?: string
}

export type SortField = 'decisionDate' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface JudgmentSort {
    field: SortField
    direction: SortDirection
}

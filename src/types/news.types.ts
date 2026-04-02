export type NewsSource = 'LiveLaw' | 'BarAndBench'
export type NewsCategory = 'all' | 'top-stories' | 'supreme-court' | 'high-court' | 'trending'

export interface NewsItem {
    id: string
    title: string
    description: string
    url: string
    publishedAt: string
    source: NewsSource
    category: string
    imageUrl: string | null
}

export interface NewsFilters {
    source?: NewsSource | ''
    category?: NewsCategory | ''
    fromDate?: string
    toDate?: string
}

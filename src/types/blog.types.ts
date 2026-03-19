export type BlogStatus = 'draft' | 'published'

export interface BlogListItem {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  tags: string[]
  status: BlogStatus
  coverImageUrl: string | null
  coverImageKey: string | null
  readTimeMinutes: number
  publishedAt: string | null
}

export interface BlogDetail extends BlogListItem {
  content: string
  coverImageKey: string | null
  updatedAt: string
}

export interface BlogFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  status: 'DRAFT' | 'PUBLISHED'
  coverImageKey: string | null
}

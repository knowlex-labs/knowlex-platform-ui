import type { BlogStatus, BlogListItem, BlogDetail } from '../types'

const STATUS_MAP: Record<string, BlogStatus> = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
}

export function mapBlogStatus(backendStatus: string): BlogStatus {
  return STATUS_MAP[backendStatus] || 'draft'
}

export function toBackendStatus(status: BlogStatus): string {
  return status === 'published' ? 'PUBLISHED' : 'DRAFT'
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapBlogListItem(raw: any): BlogListItem {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    category: raw.category,
    tags: raw.tags ?? [],
    status: mapBlogStatus(raw.status),
    coverImageUrl: raw.coverImageUrl ?? raw.cover_image_url ?? null,
    coverImageKey: raw.coverImageKey ?? raw.cover_image_key ?? null,
    readTimeMinutes: raw.readTimeMinutes ?? raw.read_time_minutes ?? 0,
    publishedAt: raw.publishedAt ?? raw.published_at ?? null,
  }
}

export function mapBlogDetail(raw: any): BlogDetail {
  return {
    ...mapBlogListItem(raw),
    content: raw.content,
    coverImageKey: raw.coverImageKey ?? raw.cover_image_key ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? '',
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

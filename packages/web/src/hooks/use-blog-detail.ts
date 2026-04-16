import { useState, useEffect, useCallback } from 'react'
import { blogApi } from '@knowlex/core/api/blog-api'
import { mapBlogDetail } from '@knowlex/core/mappers'
import type { BlogDetail } from '@knowlex/core/types'

export function useBlogDetail(slug: string | undefined) {
  const [blog, setBlog] = useState<BlogDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBlog = useCallback(async (s: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await blogApi.getBySlug(s)
      const mapped = mapBlogDetail(response.data)

      // If coverImageUrl is missing but we have the S3 key, fetch a presigned URL
      if (!mapped.coverImageUrl && mapped.coverImageKey) {
        try {
          const url = await blogApi.getCoverDownloadUrl(mapped.coverImageKey)
          mapped.coverImageUrl = url
        } catch {
          // Silently ignore — show gradient fallback
        }
      }

      setBlog(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog post')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (slug) {
      fetchBlog(slug)
    }
  }, [slug, fetchBlog])

  const refresh = useCallback(() => {
    if (slug) fetchBlog(slug)
  }, [slug, fetchBlog])

  return { blog, isLoading, error, refresh }
}

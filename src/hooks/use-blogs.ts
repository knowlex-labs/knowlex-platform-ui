import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { blogApi } from '@/services/api/blog-api'
import { mapBlogListItem } from '@/services/mappers/blog-mapper'
import type { BlogListItem } from '@/types'

const DEFAULT_PAGE_SIZE = 9

interface Pagination {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export function useBlogs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPage = Number(searchParams.get('page') || '0')
  const initialCategory = searchParams.get('category') || ''

  const [blogs, setBlogs] = useState<BlogListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategoryState] = useState(initialCategory)
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  })

  const categoryRef = useRef(category)
  categoryRef.current = category

  const fetchBlogs = useCallback(async (cat: string, page: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await blogApi.list({
        category: cat || undefined,
        page,
        size: DEFAULT_PAGE_SIZE,
      })
      const pageData = response.data
      const mapped = pageData.content.map(mapBlogListItem)

      // For items missing coverImageUrl but having a key, fetch presigned URLs
      const withImages = await Promise.all(
        mapped.map(async (item) => {
          if (!item.coverImageUrl && item.coverImageKey) {
            try {
              const url = await blogApi.getCoverDownloadUrl(item.coverImageKey)
              return { ...item, coverImageUrl: url }
            } catch {
              return item
            }
          }
          return item
        })
      )

      setBlogs(withImages)
      setPagination({
        page: pageData.number,
        size: pageData.size,
        totalElements: pageData.totalElements,
        totalPages: pageData.totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blogs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlogs(category, pagination.page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setCategory = useCallback((cat: string) => {
    setCategoryState(cat)
    const params = new URLSearchParams()
    if (cat) params.set('category', cat)
    setSearchParams(params, { replace: true })
    fetchBlogs(cat, 0)
  }, [fetchBlogs, setSearchParams])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
    const params = new URLSearchParams()
    if (categoryRef.current) params.set('category', categoryRef.current)
    if (page > 0) params.set('page', String(page))
    setSearchParams(params, { replace: true })
    fetchBlogs(categoryRef.current, page)
  }, [fetchBlogs, setSearchParams])

  const refresh = useCallback(() => {
    fetchBlogs(categoryRef.current, pagination.page)
  }, [fetchBlogs, pagination.page])

  return { blogs, isLoading, error, category, setCategory, pagination, setPage, refresh }
}

import { useState, useCallback, useEffect } from 'react'
import { blogApi } from '@knowlex/core/api/blog-api'
import { mapBlogListItem } from '@knowlex/core/mappers'
import type { BlogListItem } from '@knowlex/core/types'

const DEFAULT_PAGE_SIZE = 20

interface Pagination {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export function useAdminBlogs() {
  const [blogs, setBlogs] = useState<BlogListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  })

  const fetchBlogs = useCallback(async (page: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await blogApi.adminList({ page, size: DEFAULT_PAGE_SIZE })
      const pageData = response.data
      setBlogs(pageData.content.map(mapBlogListItem))
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
    fetchBlogs(0)
  }, [fetchBlogs])

  const setPage = useCallback((page: number) => {
    fetchBlogs(page)
  }, [fetchBlogs])

  const deleteBlog = useCallback(async (id: string) => {
    await blogApi.delete(id)
    fetchBlogs(pagination.page)
  }, [fetchBlogs, pagination.page])

  const refresh = useCallback(() => {
    fetchBlogs(pagination.page)
  }, [fetchBlogs, pagination.page])

  return { blogs, isLoading, error, pagination, setPage, deleteBlog, refresh }
}

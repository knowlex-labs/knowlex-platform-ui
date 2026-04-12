import { useState, useCallback, useEffect } from 'react'
import { blogApi } from '@knowlex/core/api/blog-api'
import type { BlogDetail, BlogFormData } from '@knowlex/core/types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMPTY_FORM: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags: [],
  status: 'DRAFT',
  coverImageKey: null,
}

export function useBlogForm(blogId?: string) {
  const [formData, setFormData] = useState<BlogFormData>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(!!blogId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSlug, setAutoSlug] = useState(true)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [existingBlog, setExistingBlog] = useState<BlogDetail | null>(null)

  // Load existing blog for edit
  useEffect(() => {
    if (!blogId) return
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await blogApi.getById(blogId)
        const blog = response.data
        if (cancelled) return
        setExistingBlog(blog)
        setFormData({
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          category: blog.category,
          tags: blog.tags,
          status: blog.status === 'published' ? 'PUBLISHED' : 'DRAFT',
          coverImageKey: blog.coverImageKey,
        })
        if (blog.coverImageUrl) {
          setCoverPreviewUrl(blog.coverImageUrl)
        }
        setAutoSlug(false)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load blog')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [blogId])

  const updateField = useCallback(<K extends keyof BlogFormData>(field: K, value: BlogFormData[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && autoSlug) {
        next.slug = slugify(value as string)
      }
      return next
    })
  }, [autoSlug])

  const setSlugManually = useCallback((slug: string) => {
    setAutoSlug(false)
    setFormData(prev => ({ ...prev, slug }))
  }, [])

  const uploadCoverImage = useCallback(async (file: File) => {
    try {
      const { uploadUrl, key } = await blogApi.getCoverUploadUrl(file.name)
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      setFormData(prev => ({ ...prev, coverImageKey: key }))
      setCoverPreviewUrl(URL.createObjectURL(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cover image')
    }
  }, [])

  const removeCoverImage = useCallback(() => {
    setFormData(prev => ({ ...prev, coverImageKey: null }))
    setCoverPreviewUrl(null)
  }, [])

  const save = useCallback(async (): Promise<BlogDetail | null> => {
    setIsSaving(true)
    setError(null)
    try {
      let response
      if (existingBlog) {
        response = await blogApi.update(existingBlog.id, formData)
      } else {
        response = await blogApi.create(formData)
      }
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blog')
      return null
    } finally {
      setIsSaving(false)
    }
  }, [formData, existingBlog])

  return {
    formData,
    updateField,
    setSlugManually,
    uploadCoverImage,
    removeCoverImage,
    coverPreviewUrl,
    save,
    isLoading,
    isSaving,
    error,
    isEdit: !!existingBlog,
  }
}

import { apiClient, adminApiClient } from './api-client'
import type { ApiResponse, PaginatedData } from '../types'
import type { BlogDetail, BlogListItem, BlogFormData } from '../types'

export interface BlogListParams {
  category?: string
  page?: number
  size?: number
}

interface CoverUploadUrlResponse {
  uploadUrl: string
  key: string
}

export const blogApi = {
  // Public endpoints — use regular apiClient
  list: async (params: BlogListParams = {}): Promise<ApiResponse<PaginatedData<BlogListItem>>> => {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())
    if (params.category) searchParams.set('category', params.category)
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<PaginatedData<BlogListItem>>>(`/api/v1/blogs${query ? `?${query}` : ''}`)
  },

  getBySlug: async (slug: string): Promise<ApiResponse<BlogDetail>> => {
    return apiClient.get<ApiResponse<BlogDetail>>(`/api/v1/blogs/${slug}`)
  },

  // Admin endpoints — use adminApiClient
  adminList: async (params: BlogListParams = {}): Promise<ApiResponse<PaginatedData<BlogListItem>>> => {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())
    if (params.category) searchParams.set('category', params.category)
    const query = searchParams.toString()
    return adminApiClient.get<ApiResponse<PaginatedData<BlogListItem>>>(`/api/v1/blogs/admin${query ? `?${query}` : ''}`)
  },

  getById: async (id: string): Promise<ApiResponse<BlogDetail>> => {
    return adminApiClient.get<ApiResponse<BlogDetail>>(`/api/v1/blogs/admin/${id}`)
  },

  create: async (data: BlogFormData): Promise<ApiResponse<BlogDetail>> => {
    return adminApiClient.post<ApiResponse<BlogDetail>>('/api/v1/blogs', data)
  },

  update: async (id: string, data: BlogFormData): Promise<ApiResponse<BlogDetail>> => {
    return adminApiClient.put<ApiResponse<BlogDetail>>(`/api/v1/blogs/${id}`, data)
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    return adminApiClient.delete<ApiResponse<null>>(`/api/v1/blogs/${id}`)
  },

  getCoverUploadUrl: async (filename: string): Promise<CoverUploadUrlResponse> => {
    const response = await adminApiClient.post<ApiResponse<CoverUploadUrlResponse>>(
      `/api/v1/blogs/cover-upload-url?filename=${encodeURIComponent(filename)}`
    )
    return response.data
  },

  getCoverDownloadUrl: async (key: string): Promise<string> => {
    const response = await apiClient.get<ApiResponse<{ downloadUrl: string }>>(
      `/api/v1/blogs/cover-image?key=${encodeURIComponent(key)}`
    )
    return response.data.downloadUrl
  },
}

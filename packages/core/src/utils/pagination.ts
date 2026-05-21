import type { PaginatedData } from '../types/api.types'

export interface PaginationMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Normalize Spring Page metadata (top-level or nested under `page`). */
export function getPaginationMeta<T>(
  data: PaginatedData<T> | null | undefined
): PaginationMeta {
  if (!data) {
    return { page: 0, size: 0, totalElements: 0, totalPages: 0 }
  }

  const meta = data.page ?? data
  return {
    page: meta.number ?? data.pageable?.pageNumber ?? 0,
    size: meta.size ?? data.pageable?.pageSize ?? 0,
    totalElements: meta.totalElements ?? 0,
    totalPages: meta.totalPages ?? 0,
  }
}

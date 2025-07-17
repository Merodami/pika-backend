import { type MultilingualText } from '@pika/types-core'

/**
 * Data Transfer Object for Categories
 * Used for transferring category data between application layers
 */
export interface CategoryDTO {
  id: string
  name: MultilingualText
  description: MultilingualText
  iconUrl: string | null
  slug: string
  parentId: string | null
  level: number
  path: string
  active: boolean
  sortOrder: number
  createdAt: Date | null
  updatedAt: Date | null
  children?: CategoryDTO[]
  // Optional localized fields used for API responses
  localizedName?: string
  localizedDescription?: string
}

/**
 * Category list response structure
 * Includes pagination metadata
 */
export interface CategoryListResponseDTO {
  data: CategoryDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

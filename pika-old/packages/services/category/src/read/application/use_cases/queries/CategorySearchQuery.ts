/**
 * Category search query parameters
 * Used by application services to retrieve categories with filtering, sorting, and pagination
 */
export interface CategorySearchQuery {
  // Filter parameters
  parentId?: string | null
  level?: number
  active?: boolean
  slug?: string
  name?: string

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'

  // Include relationships parameters
  includeChildren?: boolean
}

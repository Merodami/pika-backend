/**
 * Provider search query parameters
 * Used by application services to retrieve providers with filtering, sorting, and pagination
 */
export interface ProviderSearchQuery {
  // Filter parameters
  userId?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
  businessName?: string
  minRating?: number
  maxRating?: number

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'

  // Include parameters
  includeUser?: boolean
}

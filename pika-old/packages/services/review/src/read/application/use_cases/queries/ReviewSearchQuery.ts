import type { PaginatedQuery } from '@pika/types-core'

/**
 * Query object for searching reviews
 * Extends pagination parameters with review-specific filters
 */
export interface ReviewSearchQuery extends PaginatedQuery {
  // Filtering by entities
  providerId?: string
  customerId?: string

  // Filtering by rating
  rating?: number
  minRating?: number
  maxRating?: number

  // Filtering by content
  hasResponse?: boolean

  // Date range filtering
  fromDate?: string
  toDate?: string

  // Include related data
  includeRelations?: boolean

  // Sorting options
  sortBy?: 'createdAt' | 'rating' | 'updatedAt' | 'responseAt'
  sortOrder?: 'asc' | 'desc'

  // Request tracking
  correlationId?: string
}

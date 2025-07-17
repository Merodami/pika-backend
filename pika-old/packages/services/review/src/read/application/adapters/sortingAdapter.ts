/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import type { schemas } from '@pika/api'
import { convertApiSortParams } from '@pika/shared'
import type { ReviewSearchQuery } from '@review-read/application/use_cases/queries/ReviewSearchQuery.js'

/**
 * Adapts API review search query to domain model ReviewSearchQuery
 * Handles transformation of sorting parameters
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptReviewSearchQuery(
  apiQuery: schemas.ReviewSearchQuery,
): ReviewSearchQuery {
  // Convert sorting parameters using our enhanced type-safe utility
  const { sortBy, sortOrder } = convertApiSortParams({
    sort: typeof apiQuery.sort === 'string' ? apiQuery.sort : undefined,
    sort_by:
      typeof apiQuery.sort_by === 'string' ? apiQuery.sort_by : undefined,
    sort_order: apiQuery.sort_order as 'asc' | 'desc' | undefined,
  })

  return {
    // Map API snake_case to domain camelCase
    providerId: apiQuery.provider_id,
    customerId: apiQuery.customer_id,
    rating: apiQuery.rating,

    // Pagination
    page: apiQuery.page,
    limit: apiQuery.limit,

    // Sorting parameters
    sortBy: sortBy as
      | 'createdAt'
      | 'rating'
      | 'updatedAt'
      | 'responseAt'
      | undefined,
    sortOrder,
  }
}

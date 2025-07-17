/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import type { schemas } from '@pika/api'
import { convertApiSortParams } from '@pika/shared'
import type { ProviderSearchQuery } from '@provider-read/application/use_cases/queries/ProviderSearchQuery.js'

/**
 * Adapts API provider search query to domain model ProviderSearchQuery
 * Handles transformation of sorting parameters
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptProviderSearchQuery(
  apiQuery: schemas.ProviderSearchQuery,
): ProviderSearchQuery {
  // Convert sorting parameters using our enhanced type-safe utility
  const { sortBy, sortOrder } = convertApiSortParams({
    sort: typeof apiQuery.sort === 'string' ? apiQuery.sort : undefined,
    sort_order: apiQuery.sort_order as 'asc' | 'desc' | undefined,
  })

  return {
    // Map API snake_case to domain camelCase
    userId: apiQuery.user_id,
    categoryId: apiQuery.category_id,
    verified:
      apiQuery.verified !== undefined ? apiQuery.verified === true : undefined,
    active:
      apiQuery.active !== undefined ? apiQuery.active === true : undefined,
    businessName: apiQuery.business_name,
    minRating: apiQuery.min_rating,
    maxRating: apiQuery.max_rating,

    // Pagination
    page: apiQuery.page,
    limit: apiQuery.limit,

    // Sorting parameters
    sortBy,
    sortOrder,
  }
}

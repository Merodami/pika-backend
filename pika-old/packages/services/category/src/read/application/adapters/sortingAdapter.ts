/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import type { CategorySearchQuery } from '@category-read/application/use_cases/queries/CategorySearchQuery.js'
import type { schemas } from '@pika/api'
import { convertApiSortParams } from '@pika/shared'

/**
 * Adapts API category search query to domain model CategorySearchQuery
 * Handles transformation of sorting parameters
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptCategorySearchQuery(
  apiQuery: schemas.CategorySearchQuery,
): Omit<CategorySearchQuery, 'slug' | 'name'> {
  // Convert sorting parameters using our enhanced type-safe utility
  const { sortBy, sortOrder } = convertApiSortParams({
    sort: typeof apiQuery.sort === 'string' ? apiQuery.sort : undefined,
    sort_by:
      typeof apiQuery.sort_by === 'string' ? apiQuery.sort_by : undefined,
    sort_order: apiQuery.sort_order as 'asc' | 'desc' | undefined,
  })

  return {
    // Map API snake_case to domain camelCase
    parentId: apiQuery.parent_id,
    level: apiQuery.level,
    active:
      apiQuery.active !== undefined ? apiQuery.active === true : undefined,
    includeChildren: apiQuery.include_children,

    // Pagination
    page: apiQuery.page,
    limit: apiQuery.limit,

    // Sorting parameters
    sortBy,
    sortOrder,
  }
}

/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import type { AdminSearchQuery } from '@admin-read/application/use_cases/queries/AdminSearchQuery.js'
import {
  AdminPermission,
  AdminRole,
  AdminStatus,
} from '@admin-read/domain/entities/Admin.js'
import type { schemas } from '@pika/api'
import { convertApiSortParams } from '@pika/shared'

/**
 * Adapts API admin search query to domain model AdminSearchQuery
 * Handles transformation of sorting parameters
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptAdminSearchQuery(
  apiQuery: schemas.AdminSearchQuery,
): Omit<AdminSearchQuery, 'email' | 'search'> {
  // Convert sorting parameters using our enhanced type-safe utility
  const { sortBy, sortOrder } = convertApiSortParams({
    sort: typeof apiQuery.sort === 'string' ? apiQuery.sort : undefined,
    sort_by:
      typeof apiQuery.sort_by === 'string' ? apiQuery.sort_by : undefined,
    sort_order: apiQuery.sort_order as 'asc' | 'desc' | undefined,
  })

  return {
    // Map API snake_case to domain camelCase
    role: apiQuery.role as AdminRole | undefined,
    status: apiQuery.status as AdminStatus | undefined,
    permissions: apiQuery.permission
      ? [apiQuery.permission as AdminPermission]
      : undefined,
    created_by: undefined, // Not in API query schema
    includePermissions: false, // Not in API query schema

    // Pagination
    page: apiQuery.page,
    limit: apiQuery.limit,

    // Sorting parameters
    sortBy,
    sortOrder,
  }
}

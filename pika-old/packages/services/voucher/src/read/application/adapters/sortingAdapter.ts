/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import type { schemas } from '@pika/api'
import { convertApiSortParams } from '@pika/shared'
import type { VoucherSearchQuery } from '@voucher-read/application/use_cases/queries/VoucherSearchQuery.js'

/**
 * Adapts API voucher search query to domain model VoucherSearchQuery
 * Handles transformation of sorting parameters
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptVoucherSearchQuery(
  apiQuery: schemas.VoucherSearchQuery,
): VoucherSearchQuery {
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
    categoryId: apiQuery.category_id,
    state: apiQuery.state as VoucherSearchQuery['state'],
    discountType: apiQuery.discount_type as VoucherSearchQuery['discountType'],
    minDiscount: apiQuery.min_discount,
    maxDiscount: apiQuery.max_discount,

    // Geospatial search
    latitude: apiQuery.latitude,
    longitude: apiQuery.longitude,
    radius: apiQuery.radius,

    // Pagination
    page: apiQuery.page,
    limit: apiQuery.limit,

    // Sorting parameters
    sortBy,
    sortOrder,
  }
}

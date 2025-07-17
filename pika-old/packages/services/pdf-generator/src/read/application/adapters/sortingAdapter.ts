/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import type { VoucherBookSearchQuery } from '@pdf-read/application/use_cases/queries/VoucherBookSearchQuery.js'
import type { schemas } from '@pika/api'
import { convertApiSortParams } from '@pika/shared'
import { VoucherBookStatus, VoucherBookType } from '@prisma/client'

/**
 * Type guard to validate VoucherBookType
 */
function isValidVoucherBookType(value: unknown): value is VoucherBookType {
  return (
    typeof value === 'string' &&
    Object.values(VoucherBookType).includes(value as VoucherBookType)
  )
}

/**
 * Type guard to validate VoucherBookStatus
 */
function isValidVoucherBookStatus(value: unknown): value is VoucherBookStatus {
  return (
    typeof value === 'string' &&
    Object.values(VoucherBookStatus).includes(value as VoucherBookStatus)
  )
}

/**
 * Safely converts API book type to domain type
 */
function validateBookType(value: unknown): VoucherBookType | undefined {
  return isValidVoucherBookType(value) ? value : undefined
}

/**
 * Safely converts API status to domain status
 */
function validateStatus(value: unknown): VoucherBookStatus | undefined {
  return isValidVoucherBookStatus(value) ? value : undefined
}

/**
 * Adapts API voucher book search query to domain model VoucherBookSearchQuery
 * Handles transformation of sorting parameters
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptVoucherBookSearchQuery(
  apiQuery: schemas.VoucherBookSearchQuery,
): VoucherBookSearchQuery {
  // Convert sorting parameters using our enhanced type-safe utility
  const { sortBy, sortOrder } = convertApiSortParams({
    sort: typeof apiQuery.sort === 'string' ? apiQuery.sort : undefined,
    sort_by:
      typeof apiQuery.sort_by === 'string' ? apiQuery.sort_by : undefined,
    sort_order: apiQuery.sort_order as 'asc' | 'desc' | undefined,
  })

  return {
    // Map API snake_case to domain camelCase with type validation
    bookType: validateBookType(apiQuery.book_type),
    status: validateStatus(apiQuery.status),
    year: apiQuery.year,
    month: apiQuery.month,
    edition: apiQuery.edition,

    // Pagination
    page: apiQuery.page,
    limit: apiQuery.limit,

    // Sorting parameters
    sortBy,
    sortOrder,
  }
}

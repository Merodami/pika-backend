import { z } from 'zod'

import { SearchParams } from '../../shared/pagination.js'
import { DateTime,UUID } from '../../shared/primitives.js'
import {
  AdminVoucherSortBy,
  AnalyticsGroupBy,
  VoucherDiscountType,
  VoucherState,
} from '../common/enums.js'
import {
  GeographicSearchParams,
  VoucherFilterParams,
} from '../common/queries.js'
import { ADMIN_VOUCHER_ALLOWED_RELATIONS } from '../common/relations.js'

/**
 * Admin voucher query parameters
 * Following the standardized SearchParams pattern with industry-standard include relations
 */

/**
 * Admin voucher search parameters
 * Extends SearchParams with voucher-specific filters
 */
export const AdminVoucherQueryParams = SearchParams.merge(
  GeographicSearchParams,
)
  .merge(VoucherFilterParams)
  .extend({
    // Voucher-specific filters
    businessId: UUID.optional(),
    categoryId: UUID.optional(),
    state: VoucherState.optional(),
    discountType: VoucherDiscountType.optional(),
    minDiscount: z.number().nonnegative().optional(),
    maxDiscount: z.number().nonnegative().optional(),
    currency: z.string().optional(),

    // Date filters
    validFromStart: DateTime.optional(),
    validFromEnd: DateTime.optional(),
    expiresAtStart: DateTime.optional(),
    expiresAtEnd: DateTime.optional(),
    createdFromStart: DateTime.optional(),
    createdFromEnd: DateTime.optional(),

    // Analytics filters
    minRedemptions: z.number().int().nonnegative().optional(),
    maxRedemptions: z.number().int().nonnegative().optional(),
    minScans: z.number().int().nonnegative().optional(),
    maxScans: z.number().int().nonnegative().optional(),

    // Admin-specific status filters
    isDeleted: z.boolean().optional(),

    // Override sortBy with service-specific enum
    sortBy: AdminVoucherSortBy.default('createdAt'),

    // Include relations (industry standard pattern)
    include: z
      .string()
      .optional()
      .describe(
        `Comma-separated relations: ${ADMIN_VOUCHER_ALLOWED_RELATIONS.join(',')}`,
      ),
  })

export type AdminVoucherQueryParams = z.infer<typeof AdminVoucherQueryParams>

/**
 * Voucher analytics query parameters
 */
export const VoucherAnalyticsQueryParams = z.object({
  startDate: DateTime.optional(),
  endDate: DateTime.optional(),
  groupBy: AnalyticsGroupBy.optional(),
})

export type VoucherAnalyticsQueryParams = z.infer<
  typeof VoucherAnalyticsQueryParams
>

/**
 * Business voucher stats query parameters
 */
export const BusinessVoucherStatsQueryParams = z.object({
  startDate: DateTime.optional(),
  endDate: DateTime.optional(),
  groupBy: AnalyticsGroupBy.optional(),
})

export type BusinessVoucherStatsQueryParams = z.infer<
  typeof BusinessVoucherStatsQueryParams
>

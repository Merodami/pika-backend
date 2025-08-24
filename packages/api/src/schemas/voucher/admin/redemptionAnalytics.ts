import { VoucherRedemptionMethod, VoucherRedemptionType } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { DateTime } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'

/**
 * Admin redemption analytics schemas
 * For tracking and analyzing voucher redemptions
 */

// ============= Enums =============

const VoucherRedemptionTypeSchema = createZodEnum(VoucherRedemptionType)
const VoucherRedemptionMethodSchema = createZodEnum(VoucherRedemptionMethod)

// ============= Query Parameters =============

/**
 * Redemption history query parameters
 */
export const RedemptionHistoryQueryParams = SearchParams.extend({
  voucherId: UUID.optional(),
  userId: UUID.optional(),
  businessId: UUID.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  redemptionType: VoucherRedemptionTypeSchema.optional(),
  redemptionMethod: VoucherRedemptionMethodSchema.optional(),
})

export const RedemptionHistoryQueryParamsSchema =
  RedemptionHistoryQueryParams.openapi('RedemptionHistoryQueryParams', {
    description: 'Query parameters for redemption history',
  })

export type RedemptionHistoryQueryParams = z.infer<
  typeof RedemptionHistoryQueryParams
>

/**
 * Redemption statistics query parameters
 */
export const RedemptionStatsQueryParams = z.object({
  businessId: UUID.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export const RedemptionStatsQueryParamsSchema =
  RedemptionStatsQueryParams.openapi('RedemptionStatsQueryParams', {
    description: 'Query parameters for redemption statistics',
  })

export type RedemptionStatsQueryParams = z.infer<
  typeof RedemptionStatsQueryParams
>

// ============= Response Schemas =============

/**
 * Redemption history record
 */
export const RedemptionHistoryRecord = z.object({
  id: UUID,
  voucherId: UUID,
  userId: UUID.nullable(),
  redeemedAt: DateTime,
  codeUsed: z.string(),
  metadata: z.record(z.string(), z.any()).nullable(),
  voucher: z
    .object({
      id: UUID,
      title: z.string(),
      businessId: UUID,
    })
    .optional(),
  user: z
    .object({
      id: UUID,
      email: z.string().email(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
    })
    .optional(),
})

export const RedemptionHistoryRecordSchema = RedemptionHistoryRecord.openapi(
  'RedemptionHistoryRecord',
  {
    description: 'Individual redemption history record',
  },
)

export type RedemptionHistoryRecord = z.infer<typeof RedemptionHistoryRecord>

/**
 * Redemption history list response
 */
export const RedemptionHistoryListResponse = paginatedResponse(
  RedemptionHistoryRecord,
  {
    description: 'Paginated list of redemption history records',
  },
)

export const RedemptionHistoryListResponseSchema =
  RedemptionHistoryListResponse.openapi('RedemptionHistoryListResponse', {
    description: 'Paginated redemption history response',
  })

export type RedemptionHistoryListResponse = z.infer<
  typeof RedemptionHistoryListResponse
>

/**
 * Daily redemption stats
 */
export const DailyRedemptionStats = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
  discountValue: z.number().nonnegative(),
})

export type DailyRedemptionStats = z.infer<typeof DailyRedemptionStats>

/**
 * Redemption statistics response
 */
export const RedemptionStatsResponse = z.object({
  totalRedemptions: z.number().int().nonnegative(),
  uniqueUsers: z.number().int().nonnegative(),
  totalDiscountValue: z.number().nonnegative(),
  byType: z.record(z.string(), z.number().int().nonnegative()),
  byMethod: z.record(z.string(), z.number().int().nonnegative()),
  dailyRedemptions: z.array(DailyRedemptionStats),
})

export const RedemptionStatsResponseSchema = RedemptionStatsResponse.openapi(
  'RedemptionStatsResponse',
  {
    description: 'Redemption statistics summary',
  },
)

export type RedemptionStatsResponse = z.infer<typeof RedemptionStatsResponse>

/**
 * Business redemption statistics response
 */
export const BusinessRedemptionStatsResponse = RedemptionStatsResponse.extend({
  businessId: UUID,
})

export const BusinessRedemptionStatsResponseSchema =
  BusinessRedemptionStatsResponse.openapi('BusinessRedemptionStatsResponse', {
    description: 'Business-specific redemption statistics',
  })

export type BusinessRedemptionStatsResponse = z.infer<
  typeof BusinessRedemptionStatsResponse
>

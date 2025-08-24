import { FIELD_LENGTH, VoucherScanSource, VoucherSortBy } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { DeviceInfo } from '../../shared/device.js'
import { Coordinates, GeoSearchParams } from '../../shared/geo.js'
import { withTimestampsString } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  CustomerVoucherStatusSchema,
  VoucherCodeTypeSchema,
  VoucherDiscountTypeSchema,
  VoucherSortBySchema,
  VoucherStateSchema,
} from '../common/enums.js'
import { VoucherFilterParams } from '../common/queries.js'

/**
 * Public voucher schemas for customer-facing operations
 * Converted from pika-old TypeBox schemas following the established pattern
 */

// ============= Voucher Code Response =============

/**
 * Voucher code response (raw Zod)
 */
export const VoucherCodeResponse = z.object({
  id: UUID,
  code: z.string(),
  type: VoucherCodeTypeSchema,
  isActive: z.boolean(),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Voucher code response (OpenAPI documented)
 */
export const VoucherCodeResponseSchema = VoucherCodeResponse.openapi(
  'VoucherCodeResponse',
  {
    description: 'Voucher code information',
  },
)

export type VoucherCodeResponse = z.infer<typeof VoucherCodeResponse>

// ============= Voucher Response =============

/**
 * Voucher response (raw Zod)
 */
export const VoucherResponse = withTimestampsString({
  id: UUID,
  businessId: UUID,
  categoryId: UUID.optional(),
  state: VoucherStateSchema,
  title: z.any().describe('Multilingual voucher title'),
  description: z.any().describe('Multilingual voucher description'),
  terms: z.any().describe('Multilingual voucher terms'),
  discountType: VoucherDiscountTypeSchema,
  discountValue: z.number().min(0),
  currency: z.string().default('PYG'),
  location: z.any().nullable().describe('GeoJSON Point or Polygon'),
  imageUrl: z.string().url().optional().nullable(),
  validFrom: z.string().datetime(),
  expiresAt: z.string().datetime(),
  maxRedemptions: z.number().int().min(1).optional().nullable(),
  maxRedemptionsPerUser: z.number().int().min(1).default(1),
  currentRedemptions: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  codes: z.array(VoucherCodeResponse).optional(),
})

/**
 * Voucher response (OpenAPI documented)
 */
export const VoucherResponseSchema = VoucherResponse.openapi(
  'VoucherResponse',
  {
    description: 'Public voucher information',
  },
)

export type VoucherResponse = z.infer<typeof VoucherResponse>

// ============= Search Vouchers =============

/**
 * Voucher query parameters (raw Zod)
 */
export const VoucherQueryParams = SearchParams.extend({
  // Filter parameters (from pika-old VoucherSearchQuerySchema)
  businessId: UUID.optional().describe('Filter by business ID'),
  categoryId: UUID.optional().describe('Filter by category ID'),
  state: VoucherStateSchema.optional().describe('Filter by voucher state'),
  discountType: VoucherDiscountTypeSchema.optional().describe(
    'Filter by discount type',
  ),
  minDiscount: z.number().min(0).optional().describe('Minimum discount value'),
  maxDiscount: z.number().min(0).optional().describe('Maximum discount value'),
  minValue: z.number().min(0).optional().describe('Minimum voucher value'),
  maxValue: z.number().min(0).optional().describe('Maximum voucher value'),
  type: z.string().optional().describe('Voucher type filter'),
  currency: z.string().optional().describe('Filter by currency'),
  validFrom: z
    .string()
    .datetime()
    .optional()
    .describe('Valid from date filter'),
  validUntil: z
    .string()
    .datetime()
    .optional()
    .describe('Valid until date filter'),
  include: z
    .string()
    .optional()
    .describe('Comma-separated relations to include'),

  // Additional public filters
  hasAvailableUses: z
    .boolean()
    .optional()
    .describe('Filter vouchers with available uses'),

  // Override default sorting with voucher-specific sort fields
  sortBy: VoucherSortBySchema.default(VoucherSortBy.CREATED_AT),
})
  .merge(GeoSearchParams)
  .merge(VoucherFilterParams)

/**
 * Voucher query parameters (OpenAPI documented)
 */
export const VoucherQueryParamsSchema = VoucherQueryParams.openapi(
  'VoucherQueryParams',
  {
    description: 'Voucher search and filter parameters',
  },
)

export type VoucherQueryParams = z.infer<typeof VoucherQueryParams>

// ============= Voucher Scan Operations =============

/**
 * Voucher scan request (raw Zod)
 * Matches @pika/types VoucherScanOptions
 * For runtime validation
 */
export const VoucherScanRequest = z.object({
  scanSource: createZodEnum(VoucherScanSource).optional(),
  location: Coordinates.optional(),
  deviceInfo: DeviceInfo.optional(),
})

export type VoucherScanRequest = z.infer<typeof VoucherScanRequest>

/**
 * Voucher scan request (OpenAPI documented)
 * Uses Schema versions to generate $ref
 */
export const VoucherScanRequestSchema = VoucherScanRequest.openapi(
  'VoucherScanRequest',
  {
    description: 'Request to track voucher scan',
  },
)

/**
 * Voucher scan response (raw Zod)
 */
export const VoucherScanResponse = z.object({
  voucher: VoucherResponse,
  scanId: UUID,
  canClaim: z.boolean(),
  alreadyClaimed: z.boolean(),
  nearbyLocations: z
    .array(
      z.object({
        name: z.string(),
        address: z.string(),
        distance: z.number(),
        coordinates: Coordinates,
      }),
    )
    .optional(),
})

/**
 * Voucher scan response (OpenAPI documented)
 */
export const VoucherScanResponseSchema = VoucherScanResponse.openapi(
  'VoucherScanResponse',
  {
    description: 'Voucher scan tracking result',
  },
)

export type VoucherScanResponse = z.infer<typeof VoucherScanResponse>

// ============= Voucher Claim Operations =============

/**
 * Voucher claim request (raw Zod)
 * Matches @pika/types VoucherClaimOptions
 */
export const VoucherClaimRequest = z.object({
  notificationPreferences: z
    .object({
      enableReminders: z.boolean().default(true),
      reminderDaysBefore: z.number().int().min(1).max(30).optional().default(3),
    })
    .optional(),
})

export type VoucherClaimRequest = z.infer<typeof VoucherClaimRequest>

/**
 * Voucher claim request (OpenAPI documented)
 */
export const VoucherClaimRequestSchema = VoucherClaimRequest.openapi(
  'VoucherClaimRequest',
  {
    description: 'Request to claim voucher to wallet',
  },
)

/**
 * Voucher claim response (raw Zod)
 */
export const VoucherClaimResponse = z.object({
  claimId: UUID,
  voucher: VoucherResponse,
  claimedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  walletPosition: z.number().int().min(0),
})

/**
 * Voucher claim response (OpenAPI documented)
 */
export const VoucherClaimResponseSchema = VoucherClaimResponse.openapi(
  'VoucherClaimResponse',
  {
    description: 'Voucher claim result',
  },
)

export type VoucherClaimResponse = z.infer<typeof VoucherClaimResponse>

// ============= Voucher Redeem Operations =============

/**
 * Voucher redeem request (raw Zod)
 * Matches @pika/types VoucherRedeemOptions
 * For runtime validation
 */
export const VoucherRedeemRequest = z.object({
  code: z.string().min(FIELD_LENGTH.CODE_MIN),
  location: Coordinates.optional(),
})

export type VoucherRedeemRequest = z.infer<typeof VoucherRedeemRequest>

/**
 * Voucher redeem request (OpenAPI documented)
 * Uses Schema versions to generate $ref
 */
export const VoucherRedeemRequestSchema = VoucherRedeemRequest.openapi(
  'VoucherRedeemRequest',
  {
    description: 'Request to redeem voucher',
  },
)

/**
 * Voucher redeem response (raw Zod)
 */
export const VoucherRedeemResponse = z.object({
  message: z.string(),
  voucherId: UUID,
  redeemedAt: z.string().datetime(),
  discountApplied: z.number().min(0),
  voucher: VoucherResponse,
})

/**
 * Voucher redeem response (OpenAPI documented)
 */
export const VoucherRedeemResponseSchema = VoucherRedeemResponse.openapi(
  'VoucherRedeemResponse',
  {
    description: 'Voucher redemption result',
  },
)

export type VoucherRedeemResponse = z.infer<typeof VoucherRedeemResponse>

// ============= Response Types =============

/**
 * Voucher list response (raw Zod)
 */
export const VoucherListResponse = paginatedResponse(VoucherResponse)

/**
 * Voucher list response (OpenAPI documented)
 */
export const VoucherListResponseSchema = VoucherListResponse.openapi(
  'VoucherListResponse',
  {
    description: 'Paginated list of vouchers',
  },
)

export type VoucherListResponse = z.infer<typeof VoucherListResponse>

/**
 * User voucher response (raw Zod)
 */
export const UserVoucherResponse = z.object({
  voucher: VoucherResponse,
  claimedAt: z.string().datetime(),
  status: CustomerVoucherStatusSchema,
  redeemedAt: z.string().datetime().nullable().optional(),
})

/**
 * User voucher response (OpenAPI documented)
 */
export const UserVoucherResponseSchema = UserVoucherResponse.openapi(
  'UserVoucherResponse',
  {
    description: 'User voucher with status information',
  },
)

export type UserVoucherResponse = z.infer<typeof UserVoucherResponse>

/**
 * User vouchers list response (raw Zod)
 */
export const UserVouchersListResponse = paginatedResponse(UserVoucherResponse)

/**
 * User vouchers list response (OpenAPI documented)
 */
export const UserVouchersListResponseSchema = UserVouchersListResponse.openapi(
  'UserVouchersListResponse',
  {
    description: 'Paginated list of user vouchers',
  },
)

export type UserVouchersListResponse = z.infer<typeof UserVouchersListResponse>

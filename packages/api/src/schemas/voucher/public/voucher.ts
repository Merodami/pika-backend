import { FIELD_LENGTH, VoucherScanSource, VoucherSortBy } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { DeviceInfo, DeviceInfoSchema } from '../../shared/device.js'
import {
  Coordinates,
  CoordinatesSchema,
  GeoSearchParams,
} from '../../shared/geo.js'
import { withTimestampsString } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  CustomerVoucherStatusSchema,
  VoucherCodeTypeSchema,
  VoucherDiscountTypeSchema,
  VoucherScanSourceSchema,
  VoucherSortBySchema,
  VoucherStateSchema,
} from '../common/enums.js'
import { VoucherFilterParams } from '../common/queries.js'

/**
 * Public voucher schemas for customer-facing operations
 * Converted from pika-old TypeBox schemas following the established pattern
 */

// ============= Voucher Code Response =============

export const VoucherCodeResponse = openapi(
  z.object({
    id: UUID,
    code: z.string(),
    type: VoucherCodeTypeSchema,
    isActive: z.boolean(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Voucher code information',
  },
)

export type VoucherCodeResponse = z.infer<typeof VoucherCodeResponse>

// ============= Voucher Response =============

export const VoucherResponse = openapi(
  withTimestampsString({
    id: UUID,
    businessId: UUID,
    categoryId: UUID,
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
  }),
  {
    description: 'Public voucher information',
  },
)

export type VoucherResponse = z.infer<typeof VoucherResponse>

// ============= Search Vouchers =============

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
export const VoucherScanRequestSchema = openapi(
  z.object({
    scanSource: VoucherScanSourceSchema.optional(),
    location: CoordinatesSchema.optional(),
    deviceInfo: DeviceInfoSchema.optional(),
  }),
  {
    description: 'Request to track voucher scan',
  },
)

export const VoucherScanResponse = openapi(
  z.object({
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
          coordinates: CoordinatesSchema,
        }),
      )
      .optional(),
  }),
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
export const VoucherClaimRequestSchema = openapi(VoucherClaimRequest, {
  description: 'Request to claim voucher to wallet',
})

export const VoucherClaimResponse = openapi(
  z.object({
    claimId: UUID,
    voucher: VoucherResponse,
    claimedAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
    walletPosition: z.number().int().min(0),
  }),
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
export const VoucherRedeemRequestSchema = openapi(
  z.object({
    code: z.string().min(FIELD_LENGTH.CODE_MIN),
    location: CoordinatesSchema.optional(),
  }),
  {
    description: 'Request to redeem voucher',
  },
)

export const VoucherRedeemResponse = openapi(
  z.object({
    message: z.string(),
    voucherId: UUID,
    redeemedAt: z.string().datetime(),
    discountApplied: z.number().min(0),
    voucher: VoucherResponse,
  }),
  {
    description: 'Voucher redemption result',
  },
)

export type VoucherRedeemResponse = z.infer<typeof VoucherRedeemResponse>

// ============= Response Types =============

export const VoucherListResponse = paginatedResponse(VoucherResponse)

export type VoucherListResponse = z.infer<typeof VoucherListResponse>

// User Vouchers Response (for GET /vouchers/user/:userId)
export const UserVoucherResponse = openapi(
  z.object({
    voucher: VoucherResponse,
    claimedAt: z.string().datetime(),
    status: CustomerVoucherStatusSchema,
    redeemedAt: z.string().datetime().nullable().optional(),
  }),
  {
    description: 'User voucher with status information',
  },
)

export type UserVoucherResponse = z.infer<typeof UserVoucherResponse>

export const UserVouchersListResponse = paginatedResponse(UserVoucherResponse)

export type UserVouchersListResponse = z.infer<typeof UserVouchersListResponse>

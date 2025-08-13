import { z } from 'zod'

import { GeoJSONPoint } from '../../shared/geo.js'
import { withTimestampsString } from '../../shared/metadata.js'
import { createBulkOperationResponse } from '../../shared/operations.js'
import { DateTime, Decimal, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  VoucherCodeTypeSchema,
  VoucherDiscountTypeSchema,
  VoucherStateSchema,
} from '../common/enums.js'
import {
  CustomerVoucher,
  VoucherCode,
  VoucherRedemption,
  VoucherScan,
} from '../common/types.js'

/**
 * Admin voucher management schemas
 * Based on pika-old voucher structure with new translation system
 */

// ============= Admin Voucher View =============

/**
 * Detailed voucher information for admin
 * Following industry standard include pattern - complete objects when included
 */
export const AdminVoucherDetailResponse = withTimestampsString({
  id: UUID,
  businessId: UUID,
  categoryId: UUID,

  // Lifecycle
  state: VoucherStateSchema,

  // Resolved content only - no translation keys exposed
  title: z.string().describe('Voucher title in requested language'),
  description: z.string().describe('Voucher description in requested language'),
  terms: z
    .string()
    .describe('Voucher terms and conditions in requested language'),

  // Discount configuration
  discountType: VoucherDiscountTypeSchema,
  discountValue: Decimal,
  currency: z.string().default('PYG'),

  // Geographic targeting
  location: GeoJSONPoint.nullable(),

  // Media
  imageUrl: z.string().url().nullable(),

  // Validity period
  validFrom: DateTime,
  expiresAt: DateTime,

  // Redemption limits
  maxRedemptions: z.number().int().nullable(),
  maxRedemptionsPerUser: z.number().int().default(1),
  currentRedemptions: z.number().int().default(0),

  // Analytics
  scanCount: z.number().int().default(0),
  claimCount: z.number().int().default(0),

  // Extensibility
  metadata: z.record(z.string(), z.any()).nullable(),

  // Soft delete
  deletedAt: DateTime.nullable(),

  // Industry standard include pattern - complete objects when ?include= used
  // Keep IDs for direct reference + optional complete objects
  business: z
    .object({ id: UUID, name: z.string() })
    .optional()
    .describe('Complete business object when ?include=business'),
  category: z
    .object({ id: UUID, name: z.string() })
    .optional()
    .describe('Complete category object when ?include=category'),
  codes: z
    .array(VoucherCode)
    .optional()
    .describe('Voucher codes when ?include=codes'),
  redemptions: z
    .array(VoucherRedemption)
    .optional()
    .describe('Redemption history when ?include=redemptions'),
  scans: z
    .array(VoucherScan)
    .optional()
    .describe('Scan analytics when ?include=scans'),
  customerVouchers: z
    .array(CustomerVoucher)
    .optional()
    .describe('Customer wallet entries when ?include=customerVouchers'),

  // Computed fields
  isActive: z.boolean(),
  isExpired: z.boolean(),
  redemptionRate: z.number().min(0).max(1),
  daysUntilExpiry: z.number().int().nullable(),
})

export const AdminVoucherDetailResponseSchema =
  AdminVoucherDetailResponse.openapi('AdminVoucherDetailResponse', {
    description:
      'Detailed voucher information for admin with industry-standard include relations',
  })

export type AdminVoucherDetailResponse = z.infer<
  typeof AdminVoucherDetailResponse
>

/**
 * Admin voucher list response
 */
export const AdminVoucherListResponse = paginatedResponse(
  AdminVoucherDetailResponse,
)

export const AdminVoucherListResponseSchema = AdminVoucherListResponse

export type AdminVoucherListResponse = z.infer<typeof AdminVoucherListResponse>

/**
 * Admin voucher response (alias for detail response)
 */
export const AdminVoucherResponse = AdminVoucherDetailResponse

export const AdminVoucherResponseSchema = AdminVoucherResponse

export type AdminVoucherResponse = z.infer<typeof AdminVoucherResponse>

// ============= Voucher Actions =============

/**
 * Create voucher request
 */
export const AdminCreateVoucherRequest = z.object({
  businessId: UUID,
  categoryId: UUID,

  // Content translations (translation service will create the keys)
  title: z
    .record(z.string(), z.string())
    .describe('Title translations by language code'),
  description: z
    .record(z.string(), z.string())
    .describe('Description translations by language code'),
  termsAndConditions: z
    .record(z.string(), z.string())
    .describe('Terms and conditions translations by language code'),

  // Discount configuration
  discountType: VoucherDiscountTypeSchema,
  discountValue: z.number().positive(),
  currency: z.string().default('PYG'),

  // Geographic targeting
  location: GeoJSONPoint.nullable().optional(),

  // Media
  imageUrl: z.string().url().nullable().optional(),

  // Validity period
  validFrom: DateTime,
  expiresAt: DateTime,

  // Redemption limits
  maxRedemptions: z.number().int().positive().nullable().optional(),
  maxRedemptionsPerUser: z.number().int().positive().default(1),

  // Extensibility
  metadata: z.record(z.string(), z.any()).nullable().optional(),
})

export const AdminCreateVoucherRequestSchema =
  AdminCreateVoucherRequest.openapi('AdminCreateVoucherRequest', {
    description: 'Create new voucher with translations',
  })

export type AdminCreateVoucherRequest = z.infer<
  typeof AdminCreateVoucherRequest
>

/**
 * Update voucher request
 */
export const AdminUpdateVoucherRequest = z.object({
  // Content translations (will update translation keys)
  title: z
    .record(z.string(), z.string())
    .optional()
    .describe('Title translations by language code'),
  description: z
    .record(z.string(), z.string())
    .optional()
    .describe('Description translations by language code'),
  termsAndConditions: z
    .record(z.string(), z.string())
    .optional()
    .describe('Terms and conditions translations by language code'),

  // Discount configuration
  discountType: VoucherDiscountTypeSchema.optional(),
  discountValue: z.number().positive().optional(),
  currency: z.string().optional(),

  // Geographic targeting
  location: GeoJSONPoint.nullable().optional(),

  // Media
  imageUrl: z.string().url().nullable().optional(),

  // Validity period
  validFrom: DateTime.optional(),
  expiresAt: DateTime.optional(),

  // Redemption limits
  maxRedemptions: z.number().int().positive().nullable().optional(),
  maxRedemptionsPerUser: z.number().int().positive().optional(),

  // Extensibility
  metadata: z.record(z.string(), z.any()).nullable().optional(),
})

export const AdminUpdateVoucherRequestSchema =
  AdminUpdateVoucherRequest.openapi('AdminUpdateVoucherRequest', {
    description: 'Update voucher information and translations',
  })

export type AdminUpdateVoucherRequest = z.infer<
  typeof AdminUpdateVoucherRequest
>

/**
 * Update voucher state request
 */
export const AdminUpdateVoucherStateRequest = z.object({
  state: VoucherStateSchema,
  reason: z.string().max(500).optional(),
})

export const AdminUpdateVoucherStateRequestSchema =
  AdminUpdateVoucherStateRequest.openapi('AdminUpdateVoucherStateRequest', {
    description: 'Update voucher state',
  })

export type AdminUpdateVoucherStateRequest = z.infer<
  typeof AdminUpdateVoucherStateRequest
>

/**
 * Generate voucher codes request
 */
export const AdminGenerateVoucherCodesRequest = z.object({
  codeType: VoucherCodeTypeSchema,
  quantity: z.number().int().positive().max(1000).default(1),
  customCodes: z
    .array(z.string().max(500))
    .optional()
    .describe('Custom codes (for STATIC type)'),
})

export const AdminGenerateVoucherCodesRequestSchema =
  AdminGenerateVoucherCodesRequest.openapi('AdminGenerateVoucherCodesRequest', {
    description: 'Generate voucher codes',
  })

export type AdminGenerateVoucherCodesRequest = z.infer<
  typeof AdminGenerateVoucherCodesRequest
>

/**
 * Upload voucher image request
 */
export const AdminUploadVoucherImageRequest = z.object({
  file: z.any().describe('Image file (multipart/form-data)'),
})

export const AdminUploadVoucherImageRequestSchema =
  AdminUploadVoucherImageRequest.openapi('AdminUploadVoucherImageRequest', {
    description: 'Upload voucher image',
  })

export type AdminUploadVoucherImageRequest = z.infer<
  typeof AdminUploadVoucherImageRequest
>

/**
 * Upload voucher image response
 */
export const AdminUploadVoucherImageResponse = z.object({
  imageUrl: z.string().url().describe('URL of the uploaded image'),
})

export const AdminUploadVoucherImageResponseSchema =
  AdminUploadVoucherImageResponse.openapi('AdminUploadVoucherImageResponse', {
    description: 'Voucher image upload response',
  })

export type AdminUploadVoucherImageResponse = z.infer<
  typeof AdminUploadVoucherImageResponse
>

// ============= Translation Management =============

/**
 * Update voucher translations request
 */
export const AdminUpdateVoucherTranslationsRequest = z.object({
  translations: z.object({
    title: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    terms: z.record(z.string(), z.string()).optional(),
  }),
})

export const AdminUpdateVoucherTranslationsRequestSchema =
  AdminUpdateVoucherTranslationsRequest.openapi(
    'AdminUpdateVoucherTranslationsRequest',
    {
      description: 'Update voucher translations for multiple languages',
    },
  )

export type AdminUpdateVoucherTranslationsRequest = z.infer<
  typeof AdminUpdateVoucherTranslationsRequest
>

/**
 * Get voucher translations response
 */
export const AdminVoucherTranslationsResponse = z.object({
  voucherId: UUID,
  translations: z.object({
    title: z.record(z.string(), z.string()),
    description: z.record(z.string(), z.string()),
    terms: z.record(z.string(), z.string()),
  }),
})

export const AdminVoucherTranslationsResponseSchema =
  AdminVoucherTranslationsResponse.openapi('AdminVoucherTranslationsResponse', {
    description: 'Voucher translations for all languages',
  })

export type AdminVoucherTranslationsResponse = z.infer<
  typeof AdminVoucherTranslationsResponse
>

// ============= Bulk Operations =============

/**
 * Bulk voucher update request
 */
export const AdminBulkVoucherUpdateRequest = z.object({
  voucherIds: z.array(UUID).min(1).max(100),
  updates: z.object({
    state: VoucherStateSchema.optional(),
    expiresAt: DateTime.optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
    maxRedemptionsPerUser: z.number().int().positive().optional(),
  }),
  reason: z.string().max(500),
})

export const AdminBulkVoucherUpdateRequestSchema =
  AdminBulkVoucherUpdateRequest.openapi('AdminBulkVoucherUpdateRequest', {
    description: 'Update multiple vouchers at once',
  })

export type AdminBulkVoucherUpdateRequest = z.infer<
  typeof AdminBulkVoucherUpdateRequest
>

/**
 * Bulk voucher operation response
 * Uses the shared bulk operation pattern
 */
export const AdminBulkVoucherOperationResponse = createBulkOperationResponse(
  'voucherId',
  UUID,
)

export const AdminBulkVoucherOperationResponseSchema =
  AdminBulkVoucherOperationResponse

export type AdminBulkVoucherOperationResponse = z.infer<
  typeof AdminBulkVoucherOperationResponse
>

// ============= Analytics =============

/**
 * Voucher analytics response
 */
export const AdminVoucherAnalyticsResponse = z.object({
  voucherId: UUID,
  period: z.object({
    start: DateTime,
    end: DateTime,
  }),
  totalScans: z.number().int().nonnegative(),
  totalClaims: z.number().int().nonnegative(),
  totalRedemptions: z.number().int().nonnegative(),
  uniqueUsers: z.number().int().nonnegative(),
  redemptionRate: z.number().min(0).max(1),
  scansBySource: z.record(z.string(), z.number().int().nonnegative()),
  scansByType: z.record(z.string(), z.number().int().nonnegative()),
  dailyStats: z.array(
    z.object({
      date: DateTime,
      scans: z.number().int().nonnegative(),
      claims: z.number().int().nonnegative(),
      redemptions: z.number().int().nonnegative(),
    }),
  ),
})

export const AdminVoucherAnalyticsResponseSchema =
  AdminVoucherAnalyticsResponse.openapi('AdminVoucherAnalyticsResponse', {
    description: 'Voucher analytics data',
  })

export type AdminVoucherAnalyticsResponse = z.infer<
  typeof AdminVoucherAnalyticsResponse
>

/**
 * Business voucher statistics
 */
export const AdminBusinessVoucherStatsResponse = z.object({
  businessId: UUID,
  period: z.object({
    start: DateTime,
    end: DateTime,
  }),
  totalVouchers: z.number().int().nonnegative(),
  activeVouchers: z.number().int().nonnegative(),
  expiredVouchers: z.number().int().nonnegative(),
  totalRedemptions: z.number().int().nonnegative(),
  totalScans: z.number().int().nonnegative(),
  averageRedemptionRate: z.number().min(0).max(1),
  topPerformingVouchers: z
    .array(
      z.object({
        voucherId: UUID,
        titleKey: z.string(),
        title: z
          .string()
          .optional()
          .describe('Resolved title in requested language'),
        redemptions: z.number().int().nonnegative(),
        redemptionRate: z.number().min(0).max(1),
      }),
    )
    .max(10),
})

export const AdminBusinessVoucherStatsResponseSchema =
  AdminBusinessVoucherStatsResponse.openapi(
    'AdminBusinessVoucherStatsResponse',
    {
      description: 'Business voucher statistics',
    },
  )

export type AdminBusinessVoucherStatsResponse = z.infer<
  typeof AdminBusinessVoucherStatsResponse
>

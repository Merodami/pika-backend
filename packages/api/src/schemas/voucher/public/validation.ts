import {
  DeepLinkMode,
  FIELD_LENGTH,
  VoucherValidationCodeType,
} from '@pika/types'
import { z } from 'zod'

import { DeviceInfo } from '../../shared/device.js'
import { Coordinates } from '../../shared/geo.js'
import { UUID } from '../../shared/primitives.js'
import {
  DeepLinkModeSchema,
  DeepLinkPlatformSchema,
  VoucherScanSourceSchema,
  VoucherValidationCodeTypeSchema,
} from '../common/enums.js'
import { VoucherResponse } from './voucher.js'

/**
 * Validation schemas for URL-based QR code operations
 * Following the established schema patterns
 */

// ============= Voucher Validation Request =============

/**
 * Voucher validation request (raw Zod)
 * For validating URL-based QR codes
 */
export const VoucherValidateRequest = z.object({
  code: z
    .string()
    .min(FIELD_LENGTH.CODE_MIN)
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid validation code format')
    .describe('Validation code from QR URL'),
  location: Coordinates.optional().describe('User location for geofencing'),
  deviceInfo: z
    .object({
      platform: DeepLinkPlatformSchema,
      appVersion: z.string().optional(),
      deviceId: z.string().optional(),
    })
    .optional()
    .describe('Device information'),
  source: VoucherScanSourceSchema.optional().describe('Source of the scan'),
})

export type VoucherValidateRequest = z.infer<typeof VoucherValidateRequest>

/**
 * Voucher validation request (OpenAPI documented)
 */
export const VoucherValidateRequestSchema = VoucherValidateRequest.openapi(
  'VoucherValidateRequest',
  {
    description: 'Request to validate a voucher with URL-based code',
  },
)

// ============= Voucher Validation Response =============

/**
 * Voucher validation response (raw Zod)
 */
export const VoucherValidateResponse = z.object({
  valid: z.boolean().describe('Whether the validation code is valid'),
  canRedeem: z.boolean().describe('Whether the voucher can be redeemed'),
  voucher: VoucherResponse.optional().describe('Voucher details if valid'),
  message: z.string().optional().describe('Validation message'),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .describe('When the validation code expires'),
  remainingUses: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Remaining redemptions available'),
})

export type VoucherValidateResponse = z.infer<typeof VoucherValidateResponse>

/**
 * Voucher validation response (OpenAPI documented)
 */
export const VoucherValidateResponseSchema = VoucherValidateResponse.openapi(
  'VoucherValidateResponse',
  {
    description: 'Result of voucher validation',
  },
)

// ============= Generate Deep Link Request =============

/**
 * Generate deep link request (raw Zod)
 */
export const GenerateDeepLinkRequest = z.object({
  type: VoucherValidationCodeTypeSchema.default(
    VoucherValidationCodeType.SCAN,
  ).describe('Type of validation code to generate'),
  mode: DeepLinkModeSchema.default(DeepLinkMode.UNIVERSAL_LINK).describe(
    'Deep link generation mode',
  ),
  ttl: z.coerce
    .number()
    .int()
    .min(60)
    .max(31536000)
    .optional()
    .describe('TTL in seconds (default based on type)'),
  campaign: z.string().optional().describe('Marketing campaign identifier'),
  includeOfflineData: z.coerce
    .boolean()
    .optional()
    .describe('Include voucher data for offline support'),
})

export type GenerateDeepLinkRequest = z.infer<typeof GenerateDeepLinkRequest>

/**
 * Generate deep link request (OpenAPI documented)
 */
export const GenerateDeepLinkRequestSchema = GenerateDeepLinkRequest.openapi(
  'GenerateDeepLinkRequest',
  {
    description: 'Request to generate a deep link for voucher QR code',
  },
)

// ============= Generate Deep Link Response =============

/**
 * Generate deep link response (raw Zod)
 */
export const GenerateDeepLinkResponse = z.object({
  deepLink: z.string().url().describe('Deep link URL (voucherbook:// scheme)'),
  universalLink: z.string().url().describe('Universal link URL (https://)'),
  qrPayload: z.string().describe('Content to encode in QR code'),
  validationCode: z.string().describe('Generated validation code'),
  expiresAt: z.string().datetime().describe('When the code expires'),
  metadata: z
    .object({
      source: VoucherScanSourceSchema,
      campaign: z.string().optional(),
      businessId: UUID.optional(),
      mode: DeepLinkModeSchema,
      generatedAt: z.string().datetime(),
    })
    .describe('Deep link metadata'),
})

export type GenerateDeepLinkResponse = z.infer<typeof GenerateDeepLinkResponse>

/**
 * Generate deep link response (OpenAPI documented)
 */
export const GenerateDeepLinkResponseSchema = GenerateDeepLinkResponse.openapi(
  'GenerateDeepLinkResponse',
  {
    description: 'Generated deep link for QR code',
  },
)

// ============= Batch Deep Link Generation =============

/**
 * Batch deep link request (raw Zod)
 */
export const BatchDeepLinkRequest = z.object({
  voucherIds: z
    .array(UUID)
    .min(1)
    .max(100)
    .describe('Voucher IDs to generate deep links for'),
  type: VoucherValidationCodeTypeSchema.default(
    VoucherValidationCodeType.PRINT,
  ).describe('Type of validation codes (print for voucher books)'),
  campaign: z.string().optional().describe('Campaign identifier'),
  batchCode: z.string().optional().describe('Batch identifier'),
  ttl: z
    .number()
    .int()
    .min(86400)
    .max(31536000)
    .optional()
    .describe('TTL in seconds (default 1 year for print)'),
})

export type BatchDeepLinkRequest = z.infer<typeof BatchDeepLinkRequest>

/**
 * Batch deep link request (OpenAPI documented)
 */
export const BatchDeepLinkRequestSchema = BatchDeepLinkRequest.openapi(
  'BatchDeepLinkRequest',
  {
    description: 'Request to generate deep links for multiple vouchers',
  },
)

// ============= Batch Deep Link Response =============

/**
 * Batch deep link response (raw Zod)
 */
export const BatchDeepLinkResponse = z.object({
  batchCode: z.string().describe('Batch identifier'),
  vouchers: z
    .array(
      z.object({
        voucherId: UUID,
        deepLink: z.string().url(),
        universalLink: z.string().url(),
        qrPayload: z.string(),
        validationCode: z.string(),
        expiresAt: z.string().datetime(),
      }),
    )
    .describe('Generated deep links for each voucher'),
  metadata: z.object({
    campaign: z.string().optional(),
    generatedAt: z.string().datetime(),
    count: z.number().int(),
  }),
})

export type BatchDeepLinkResponse = z.infer<typeof BatchDeepLinkResponse>

/**
 * Batch deep link response (OpenAPI documented)
 */
export const BatchDeepLinkResponseSchema = BatchDeepLinkResponse.openapi(
  'BatchDeepLinkResponse',
  {
    description: 'Batch of generated deep links',
  },
)

// ============= Updated Redeem Request with Validation Code =============

/**
 * Enhanced voucher redeem request with validation code (raw Zod)
 * Replaces JWT-based redemption
 */
export const VoucherRedeemWithCodeRequest = z.object({
  validationCode: z
    .string()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid validation code format')
    .describe('Validation code from URL-based QR'),
  location: Coordinates.optional().describe('Redemption location'),
  deviceInfo: DeviceInfo.optional().describe('Device information'),
})

export type VoucherRedeemWithCodeRequest = z.infer<
  typeof VoucherRedeemWithCodeRequest
>

/**
 * Enhanced voucher redeem request (OpenAPI documented)
 */
export const VoucherRedeemWithCodeRequestSchema =
  VoucherRedeemWithCodeRequest.openapi('VoucherRedeemWithCodeRequest', {
    description: 'Request to redeem voucher with validation code',
  })

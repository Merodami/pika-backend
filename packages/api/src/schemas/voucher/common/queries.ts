import { z } from 'zod'

/**
 * Common query parameter patterns for voucher service
 * These are shared between public and admin tiers
 *
 * Note: Geographic search params moved to shared/geo.ts
 */

/**
 * Voucher filter parameters
 * Common filters used across tiers
 */
export const VoucherFilterParams = z.object({
  isActive: z.boolean().optional().describe('Filter by active status'),
  isExpired: z.boolean().optional().describe('Filter by expired status'),
  hasLocation: z.boolean().optional().describe('Filter vouchers with location'),
  hasImage: z.boolean().optional().describe('Filter vouchers with image'),
})

export type VoucherFilterParams = z.infer<typeof VoucherFilterParams>

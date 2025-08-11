import { z } from 'zod'

import { GeoJSONPoint } from '../../shared/geo.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import {
  CustomerVoucherStatusSchema,
  VoucherCodeTypeSchema,
  VoucherScanSourceSchema,
  VoucherScanTypeSchema,
} from './enums.js'

/**
 * Common voucher-related types used across all tiers
 * Based on pika-old voucher structure
 */

/**
 * Voucher code information
 */
export const VoucherCode = z.object({
  id: UUID,
  code: z.string().max(500),
  type: VoucherCodeTypeSchema,
  isActive: z.boolean(),
  metadata: z.record(z.string(), z.any()).nullable(),
  createdAt: DateTime,
  updatedAt: DateTime,
})

export type VoucherCode = z.infer<typeof VoucherCode>

/**
 * Voucher redemption information
 */
export const VoucherRedemption = z.object({
  id: UUID,
  userId: UUID,
  codeUsed: z.string(),
  redeemedAt: DateTime,
  metadata: z.record(z.string(), z.any()).nullable(),
  createdAt: DateTime,
})

export type VoucherRedemption = z.infer<typeof VoucherRedemption>

/**
 * Voucher scan analytics
 */
export const VoucherScan = z.object({
  id: UUID,
  userId: UUID.nullable(),
  scanType: VoucherScanTypeSchema,
  scanSource: VoucherScanSourceSchema,
  location: GeoJSONPoint.nullable(),
  deviceInfo: z.record(z.string(), z.any()),
  scannedAt: DateTime,
  createdAt: DateTime,
})

export type VoucherScan = z.infer<typeof VoucherScan>

/**
 * Customer voucher wallet entry
 */
export const CustomerVoucher = z.object({
  id: UUID,
  customerId: UUID,
  claimedAt: DateTime,
  status: CustomerVoucherStatusSchema,
  notificationPreferences: z.record(z.string(), z.any()).nullable(),
  redeemedAt: DateTime.nullable(),
  createdAt: DateTime,
  updatedAt: DateTime,
})

export type CustomerVoucher = z.infer<typeof CustomerVoucher>

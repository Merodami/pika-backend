import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * Voucher-specific enums converted from pika-old TypeBox to Zod
 * Following the standardized pattern with camelCase
 */

// Voucher state enum (from pika-old VoucherState)
export const VoucherState = z.enum([
  'new',
  'published',
  'claimed',
  'redeemed',
  'expired',
])

export type VoucherState = z.infer<typeof VoucherState>

// Voucher discount type enum (from pika-old VoucherDiscountType)
export const VoucherDiscountType = z.enum(['percentage', 'fixed'])

export type VoucherDiscountType = z.infer<typeof VoucherDiscountType>

// Voucher code type enum (from pika-old VoucherCodeType)
export const VoucherCodeType = z.enum(['qr', 'short', 'static'])

export type VoucherCodeType = z.infer<typeof VoucherCodeType>

// Voucher scan source enum (from pika-old VoucherScanSource)
export const VoucherScanSource = z.enum(['camera', 'gallery', 'link', 'share'])

export type VoucherScanSource = z.infer<typeof VoucherScanSource>

// Voucher scan type enum (from pika-old VoucherScanType)
export const VoucherScanType = z.enum(['customer', 'business'])

export type VoucherScanType = z.infer<typeof VoucherScanType>

// Customer voucher status enum (from pika-old CustomerVoucherStatus)
export const CustomerVoucherStatus = z.enum(['claimed', 'redeemed', 'expired'])

export type CustomerVoucherStatus = z.infer<typeof CustomerVoucherStatus>

// Analytics grouping period enum
export const AnalyticsGroupBy = z.enum(['day', 'week', 'month'])

export type AnalyticsGroupBy = z.infer<typeof AnalyticsGroupBy>

// Voucher sort fields for search (converted from pika-old VoucherSortFields to camelCase)
export const VoucherSortField = z.enum([
  'title',
  'createdAt',
  'updatedAt',
  'expiresAt',
  'discountValue',
])

export type VoucherSortField = z.infer<typeof VoucherSortField>

// Public voucher sort fields (used in public API)
export const VoucherSortBy = z.enum([
  'createdAt',
  'updatedAt',
  'expiresAt',
  'discountValue',
  'title',
])

export type VoucherSortBy = z.infer<typeof VoucherSortBy>

// Admin voucher sort fields (additional admin-only fields in camelCase)
export const AdminVoucherSortField = z.enum([
  'title',
  'createdAt',
  'updatedAt',
  'expiresAt',
  'discountValue',
  'currentRedemptions',
  'maxRedemptions',
  'businessId',
  'categoryId',
  'state',
])

export type AdminVoucherSortField = z.infer<typeof AdminVoucherSortField>

// OpenAPI schemas with descriptions
export const VoucherStateSchema = openapi(VoucherState, {
  description: 'Current state of the voucher lifecycle',
  example: 'published',
})

export const VoucherDiscountTypeSchema = openapi(VoucherDiscountType, {
  description: 'Type of discount the voucher provides',
  example: 'percentage',
})

export const VoucherCodeTypeSchema = openapi(VoucherCodeType, {
  description: 'Type of voucher code',
  example: 'qr',
})

export const VoucherScanSourceSchema = openapi(VoucherScanSource, {
  description: 'Source of the voucher scan',
  example: 'camera',
})

export const VoucherScanTypeSchema = openapi(VoucherScanType, {
  description: 'Type of voucher scan',
  example: 'customer',
})

export const CustomerVoucherStatusSchema = openapi(CustomerVoucherStatus, {
  description: 'Status of voucher from customer perspective',
  example: 'claimed',
})

export const VoucherSortFieldSchema = openapi(VoucherSortField, {
  description: 'Field to sort vouchers by',
  example: 'createdAt',
})

export const AdminVoucherSortFieldSchema = openapi(AdminVoucherSortField, {
  description: 'Field to sort vouchers by (admin view)',
  example: 'createdAt',
})

// Admin voucher sort fields (used in admin management)
export const AdminVoucherSortBy = z.enum([
  'createdAt',
  'updatedAt',
  'state',
  'discountValue',
  'currentRedemptions',
  'expiresAt',
  'businessId',
])

export type AdminVoucherSortBy = z.infer<typeof AdminVoucherSortBy>

export const AdminVoucherSortBySchema = openapi(AdminVoucherSortBy, {
  description: 'Admin voucher sort fields',
  example: 'createdAt',
})

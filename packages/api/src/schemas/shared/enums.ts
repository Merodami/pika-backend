import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'

/**
 * Shared enum schemas for consistent use across all API schemas
 */

// ============= User Enums =============

/**
 * User roles - matches database UserRole enum exactly
 */
export const UserRole = z.enum(['ADMIN', 'CUSTOMER', 'BUSINESS'])

export type UserRole = z.infer<typeof UserRole>

/**
 * User status - matches database UserStatus enum exactly
 */
export const UserStatus = z.enum(['ACTIVE', 'SUSPENDED', 'UNCONFIRMED'])

export type UserStatus = z.infer<typeof UserStatus>

// ============= Payment Enums =============

/**
 * Payment status - matches database PaymentStatus enum exactly
 */
export const PaymentStatus = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
])

export type PaymentStatus = z.infer<typeof PaymentStatus>

/**
 * Payment type - matches database PaymentType enum exactly
 */
export const PaymentType = z.enum([
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'CASH',
])

export type PaymentType = z.infer<typeof PaymentType>

// ============= Voucher Enums =============

/**
 * Voucher state - matches database VoucherState enum exactly
 */
export const VoucherState = z.enum([
  'NEW',
  'PUBLISHED',
  'CLAIMED',
  'REDEEMED',
  'EXPIRED',
])

export type VoucherState = z.infer<typeof VoucherState>

/**
 * Voucher discount type - matches database VoucherDiscountType enum exactly
 */
export const VoucherDiscountType = z.enum(['PERCENTAGE', 'FIXED'])

export type VoucherDiscountType = z.infer<typeof VoucherDiscountType>

/**
 * Voucher code type - matches database VoucherCodeType enum exactly
 */
export const VoucherCodeType = z.enum(['QR', 'SHORT', 'STATIC'])

export type VoucherCodeType = z.infer<typeof VoucherCodeType>

/**
 * Customer voucher status - matches database CustomerVoucherStatus enum exactly
 */
export const CustomerVoucherStatus = z.enum(['CLAIMED', 'REDEEMED', 'EXPIRED'])

export type CustomerVoucherStatus = z.infer<typeof CustomerVoucherStatus>

// ============= Auth Enums =============

/**
 * Device type - matches database DeviceType enum exactly
 */
export const DeviceType = z.enum(['ios', 'android', 'web', 'desktop'])

export type DeviceType = z.infer<typeof DeviceType>

/**
 * MFA method - matches database MfaMethod enum exactly
 */
export const MfaMethod = z.enum(['sms', 'totp', 'email', 'backup_codes'])

export type MfaMethod = z.infer<typeof MfaMethod>

// ============= Common Query Enums =============

/**
 * Sort order - used across all sortable endpoints
 */
export const SortOrder = z.enum(['asc', 'desc'])
export type SortOrder = z.infer<typeof SortOrder>

/**
 * Common timestamp sort fields - used by entities that only sort by timestamps
 */
export const TimestampSortBy = z.enum(['CREATED_AT', 'UPDATED_AT'])
export type TimestampSortBy = z.infer<typeof TimestampSortBy>

// ============= Support Enums =============

/**
 * Support ticket status - shared across public and admin APIs
 */
export const TicketStatus = z.enum([
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
  'RESOLVED',
  'CLOSED',
])
export type TicketStatus = z.infer<typeof TicketStatus>

/**
 * Support ticket priority - shared across public and admin APIs
 */
export const TicketPriority = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
  'CRITICAL',
])
export type TicketPriority = z.infer<typeof TicketPriority>

/**
 * Support ticket type - shared across public and admin APIs
 */
export const TicketType = z.enum([
  'BILLING',
  'TECHNICAL',
  'ACCOUNT',
  'GENERAL',
  'BUG_REPORT',
  'FEATURE_REQUEST',
])
export type TicketType = z.infer<typeof TicketType>

/**
 * Problem sort fields - shared across public and admin APIs
 */
export const ProblemSortBy = z.enum([
  'CREATED_AT',
  'UPDATED_AT',
  'PRIORITY',
  'STATUS',
])
export type ProblemSortBy = z.infer<typeof ProblemSortBy>

// ============= Category Enums =============

/**
 * Category sort fields - shared across public and admin APIs
 */
export const CategorySortBy = z.enum([
  'name',
  'sortOrder',
  'createdAt',
  'updatedAt',
])
export type CategorySortBy = z.infer<typeof CategorySortBy>

// ============= PDF Service Enums =============

/**
 * Voucher book status - matches database VoucherBookStatus enum exactly
 */
export const VoucherBookStatus = z.enum([
  'draft',
  'ready_for_print',
  'published',
  'archived',
])

export type VoucherBookStatus = z.infer<typeof VoucherBookStatus>

/**
 * Voucher book type - matches database VoucherBookType enum exactly
 */
export const VoucherBookType = z.enum([
  'monthly',
  'special_edition',
  'regional',
  'seasonal',
  'promotional',
])

export type VoucherBookType = z.infer<typeof VoucherBookType>

/**
 * Page layout type - matches database PageLayoutType enum exactly
 */
export const PageLayoutType = z.enum([
  'standard',
  'mixed',
  'full_page',
  'custom',
])

export type PageLayoutType = z.infer<typeof PageLayoutType>

/**
 * Ad size - matches database AdSize enum exactly
 */
export const AdSize = z.enum(['single', 'quarter', 'half', 'full'])

export type AdSize = z.infer<typeof AdSize>

/**
 * Content type - matches database ContentType enum exactly
 */
export const ContentType = z.enum(['voucher', 'image', 'ad', 'sponsored'])

export type ContentType = z.infer<typeof ContentType>

// ============= OpenAPI Documentation =============

/**
 * OpenAPI documented user role enum
 */
export const UserRoleSchema = openapi(UserRole, {
  description: 'User role in the system',
  example: UserRole.enum.CUSTOMER,
})

/**
 * OpenAPI documented user status enum
 */
export const UserStatusSchema = openapi(UserStatus, {
  description: 'User account status',
  example: 'ACTIVE',
})

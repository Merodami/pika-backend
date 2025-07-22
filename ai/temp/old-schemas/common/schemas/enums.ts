import { z } from 'zod'

import { openapi } from '../utils/openapi.js'

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
export const UserStatus = z.enum([
  'ACTIVE',
  'INACTIVE',
  'BANNED',
  'UNCONFIRMED',
])

export type UserStatus = z.infer<typeof UserStatus>

// ============= Session Enums =============

/**
 * Session status - matches database SessionStatus enum exactly
 */
export const SessionStatus = z.enum([
  'UPCOMING',
  'PENDING_APPROVAL',
  'PAYMENT_PENDING',
  'COMPLETED',
  'CANCELLED',
  'DECLINED',
])

export type SessionStatus = z.infer<typeof SessionStatus>

/**
 * Session purpose - matches database SessionPurpose enum exactly
 */
export const SessionPurpose = z.enum(['WORKING', 'WORKOUT', 'CONTENT'])

export type SessionPurpose = z.infer<typeof SessionPurpose>

/**
 * Invitation status - matches database InvitationStatus enum exactly
 */
export const InvitationStatus = z.enum(['PENDING', 'ACCEPTED', 'DECLINED'])

export type InvitationStatus = z.infer<typeof InvitationStatus>

/**
 * Session invitee status - matches database enum exactly
 */
export const SessionInviteeStatus = z.enum([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'NO_SHOW',
  'CANCELLED',
])

export type SessionInviteeStatus = z.infer<typeof SessionInviteeStatus>

/**
 * Session waiting list status - matches database enum exactly
 */
export const SessionWaitingListStatus = z.enum([
  'WAITING',
  'ACCEPTED',
  'DECLINED',
  'LEFT',
])

export type SessionWaitingListStatus = z.infer<typeof SessionWaitingListStatus>

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
  'DRAFT',
  'READY_FOR_PRINT',
  'PUBLISHED',
  'ARCHIVED',
])

export type VoucherBookStatus = z.infer<typeof VoucherBookStatus>

/**
 * Voucher book type - matches database VoucherBookType enum exactly
 */
export const VoucherBookType = z.enum([
  'MONTHLY',
  'SPECIAL_EDITION',
  'REGIONAL',
  'SEASONAL',
  'PROMOTIONAL',
])

export type VoucherBookType = z.infer<typeof VoucherBookType>

/**
 * Page layout type - matches database PageLayoutType enum exactly
 */
export const PageLayoutType = z.enum([
  'STANDARD',
  'MIXED',
  'FULL_PAGE',
  'CUSTOM',
])

export type PageLayoutType = z.infer<typeof PageLayoutType>

/**
 * Ad size - matches database AdSize enum exactly
 */
export const AdSize = z.enum(['SINGLE', 'QUARTER', 'HALF', 'FULL'])

export type AdSize = z.infer<typeof AdSize>

/**
 * Content type - matches database ContentType enum exactly
 */
export const ContentType = z.enum(['VOUCHER', 'IMAGE', 'AD', 'SPONSORED'])

export type ContentType = z.infer<typeof ContentType>

/**
 * Voucher book sorting options
 */
export const VoucherBookSortBy = z.enum([
  'createdAt',
  'updatedAt',
  'title',
  'year',
  'month',
  'status',
  'publishedAt',
])

export type VoucherBookSortBy = z.infer<typeof VoucherBookSortBy>

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

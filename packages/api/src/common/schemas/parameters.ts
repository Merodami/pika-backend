import { z } from 'zod'

import { Email, UserId } from './branded.js'
import { UUID } from './primitives.js'
import { openapi } from '../utils/openapi.js'

/**
 * Shared parameter schemas used across all API tiers (public, admin, internal)
 */

// ============= User Parameters =============

/**
 * User ID path parameter
 */
export const UserIdParam = openapi(
  z.object({
    id: UserId,
  }),
  {
    description: 'User ID path parameter',
  },
)

export type UserIdParam = z.infer<typeof UserIdParam>

/**
 * Email path parameter
 */
export const EmailParam = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Email path parameter',
  },
)

export type EmailParam = z.infer<typeof EmailParam>

// ============= PDF Service Parameters =============

/**
 * Voucher book ID path parameter
 */
export const VoucherBookIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Voucher book ID path parameter',
  },
)

export type VoucherBookIdParam = z.infer<typeof VoucherBookIdParam>

/**
 * Ad placement ID path parameter
 */
export const AdPlacementIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Ad placement ID path parameter',
  },
)

export type AdPlacementIdParam = z.infer<typeof AdPlacementIdParam>

/**
 * Book distribution ID path parameter
 */
export const BookDistributionIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Book distribution ID path parameter',
  },
)

export type BookDistributionIdParam = z.infer<typeof BookDistributionIdParam>

/**
 * Voucher book page ID path parameter
 */
export const VoucherBookPageIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Voucher book page ID path parameter',
  },
)

export type VoucherBookPageIdParam = z.infer<typeof VoucherBookPageIdParam>

// ============= Generic Parameters =============

/**
 * Generic UUID path parameter
 */
export const UUIDParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'UUID path parameter',
  },
)

export type UUIDParam = z.infer<typeof UUIDParam>
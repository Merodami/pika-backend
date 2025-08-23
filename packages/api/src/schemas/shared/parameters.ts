import { z } from 'zod'

import { Email, UserId } from './branded.js'
import { UUID } from './primitives.js'

/**
 * Shared parameter schemas used across all API tiers (public, admin, internal)
 */

// ============= Category Parameters =============

/**
 * Category ID path parameter (raw Zod)
 */
export const CategoryIdParam = z.object({
  id: UUID,
})

/**
 * Category ID path parameter (OpenAPI documented)
 */
export const CategoryIdParamSchema = CategoryIdParam.openapi(
  'CategoryIdParam',
  {
    description: 'Category ID path parameter',
  },
)

export type CategoryIdParam = z.infer<typeof CategoryIdParam>

// ============= User Parameters =============

/**
 * User ID path parameter (raw Zod)
 */
export const UserIdParam = z.object({
  id: UserId,
})

/**
 * User ID path parameter (OpenAPI documented)
 */
export const UserIdParamSchema = UserIdParam.openapi(
  'UserIdParam',
  {
    description: 'User ID path parameter',
  },
)

export type UserIdParam = z.infer<typeof UserIdParam>

/**
 * Email path parameter (raw Zod)
 */
export const EmailParam = z.object({
  email: Email,
})

/**
 * Email path parameter (OpenAPI documented)
 */
export const EmailParamSchema = EmailParam.openapi(
  'EmailParam',
  {
    description: 'Email path parameter',
  },
)

export type EmailParam = z.infer<typeof EmailParam>

// ============= Business Parameters =============

/**
 * Business ID path parameter (raw Zod)
 */
export const BusinessIdParam = z.object({
  id: UUID,
})

/**
 * Business ID path parameter (OpenAPI documented)
 */
export const BusinessIdParamSchema = BusinessIdParam.openapi(
  'BusinessIdParam',
  {
    description: 'Business ID path parameter',
  },
)

export type BusinessIdParam = z.infer<typeof BusinessIdParam>

// ============= Voucher Parameters =============

/**
 * Voucher ID path parameter (raw Zod)
 */
export const VoucherIdParam = z.object({
  id: UUID,
})

/**
 * Voucher ID path parameter (OpenAPI documented)
 */
export const VoucherIdParamSchema = VoucherIdParam.openapi(
  'VoucherIdParam',
  {
    description: 'Voucher ID path parameter',
  },
)

export type VoucherIdParam = z.infer<typeof VoucherIdParam>

// ============= Generic Parameters =============

/**
 * Generic UUID path parameter (raw Zod)
 */
export const UUIDParam = z.object({
  id: UUID,
})

/**
 * Generic UUID path parameter (OpenAPI documented)
 */
export const UUIDParamSchema = UUIDParam.openapi(
  'UUIDParam',
  {
    description: 'UUID path parameter',
  },
)

export type UUIDParam = z.infer<typeof UUIDParam>

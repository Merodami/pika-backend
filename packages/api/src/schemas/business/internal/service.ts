import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { UUID } from '../../shared/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Internal business service schemas for service-to-service communication
 */

// ============= Business Data for Services =============

/**
 * Internal business data (minimal fields for service consumption)
 */
export const InternalBusinessData = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    businessNameKey: z.string(),
    businessDescriptionKey: z.string().optional(),
    categoryId: UUID,
    verified: z.boolean(),
    active: z.boolean(),
    avgRating: z.number().min(0).max(5),
  }),
  {
    description: 'Internal business data for services',
  },
)

export type InternalBusinessData = z.infer<typeof InternalBusinessData>

// ============= Query Parameters =============

/**
 * Internal business query parameters
 */
export const InternalBusinessQueryParams = z.object({
  verified: z.boolean().optional(),
  active: z.boolean().optional(),
  categoryId: UUID.optional(),
})

export type InternalBusinessQueryParams = z.infer<
  typeof InternalBusinessQueryParams
>

// ============= Get Businesses by IDs =============

/**
 * Bulk get businesses request
 */
export const BulkBusinessRequest = openapi(
  z.object({
    businessIds: z.array(UUID).min(1).max(100),
  }),
  {
    description: 'Get multiple businesses by IDs',
  },
)

export type BulkBusinessRequest = z.infer<typeof BulkBusinessRequest>

/**
 * Bulk get businesses response
 */
export const BulkBusinessResponse = openapi(
  z.object({
    businesses: z.array(InternalBusinessData),
    notFound: z.array(UUID).optional(),
  }),
  {
    description: 'Businesses data with not found IDs',
  },
)

export type BulkBusinessResponse = z.infer<typeof BulkBusinessResponse>

// ============= Validate Businesses =============

/**
 * Validate businesses request
 */
export const ValidateBusinessRequest = openapi(
  z.object({
    businessIds: z.array(UUID).min(1).max(100),
    checkActive: z.boolean().default(true),
    checkVerified: z.boolean().default(false),
  }),
  {
    description:
      'Validate businesses exist and optionally check if active/verified',
  },
)

export type ValidateBusinessRequest = z.infer<typeof ValidateBusinessRequest>

/**
 * Validate businesses response
 */
export const ValidateBusinessResponse = openapi(
  z.object({
    valid: z.array(UUID),
    invalid: z.array(
      z.object({
        id: UUID,
        reason: z.string(),
      }),
    ),
  }),
  {
    description: 'Validation results for businesses',
  },
)

export type ValidateBusinessResponse = z.infer<typeof ValidateBusinessResponse>

// ============= Get Businesses by User =============

/**
 * Get businesses by user request
 */
export const GetBusinessesByUserRequest = openapi(
  z.object({
    userId: UserId,
    includeInactive: z.boolean().default(false),
    includeUnverified: z.boolean().default(true),
  }),
  {
    description: 'Get all businesses owned by a user',
  },
)

export type GetBusinessesByUserRequest = z.infer<
  typeof GetBusinessesByUserRequest
>

/**
 * Get businesses by user response
 */
export const GetBusinessesByUserResponse = openapi(
  z.object({
    businesses: z.array(InternalBusinessData),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'User businesses data',
  },
)

export type GetBusinessesByUserResponse = z.infer<
  typeof GetBusinessesByUserResponse
>

// ============= Get Businesses by Category =============

/**
 * Get businesses by category request
 */
export const GetBusinessesByCategoryRequest = openapi(
  z.object({
    categoryId: UUID,
    onlyActive: z.boolean().default(true),
    onlyVerified: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(50),
  }),
  {
    description: 'Get businesses in a specific category',
  },
)

export type GetBusinessesByCategoryRequest = z.infer<
  typeof GetBusinessesByCategoryRequest
>

/**
 * Get businesses by category response
 */
export const GetBusinessesByCategoryResponse = openapi(
  z.object({
    businesses: z.array(InternalBusinessData),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'Category businesses data',
  },
)

export type GetBusinessesByCategoryResponse = z.infer<
  typeof GetBusinessesByCategoryResponse
>

// ============= Check Business Exists =============

/**
 * Check business exists request
 */
export const CheckBusinessExistsRequest = openapi(
  z.object({
    businessId: UUID,
  }),
  {
    description: 'Check if business exists and is active',
  },
)

export type CheckBusinessExistsRequest = z.infer<
  typeof CheckBusinessExistsRequest
>

/**
 * Check business exists response
 */
export const CheckBusinessExistsResponse = openapi(
  z.object({
    exists: z.boolean(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    business: InternalBusinessData.optional(),
  }),
  {
    description: 'Business existence check result',
  },
)

export type CheckBusinessExistsResponse = z.infer<
  typeof CheckBusinessExistsResponse
>

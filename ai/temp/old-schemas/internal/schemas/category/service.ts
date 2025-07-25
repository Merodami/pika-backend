import { z } from 'zod'

import { UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Internal category service schemas for service-to-service communication
 */

// ============= Category Data for Services =============

/**
 * Internal category data (minimal fields for service consumption)
 */
export const InternalCategoryData = openapi(
  z.object({
    id: UUID,
    nameKey: z.string(),
    descriptionKey: z.string().optional(),
    icon: z.string().optional(),
    parentId: UUID.optional(),
    isActive: z.boolean(),
    sortOrder: z.number().int(),
  }),
  {
    description: 'Internal category data for services',
  },
)

export type InternalCategoryData = z.infer<typeof InternalCategoryData>

// ============= Get Categories =============

/**
 * Get categories request
 */
export const GetCategoriesRequest = openapi(
  z.object({
    categoryIds: z.array(UUID).min(1).max(100),
  }),
  {
    description: 'Get categories by IDs',
  },
)

export type GetCategoriesRequest = z.infer<typeof GetCategoriesRequest>

/**
 * Get categories response
 */
export const GetCategoriesResponse = openapi(
  z.object({
    categories: z.array(InternalCategoryData),
    notFound: z.array(UUID).optional(),
  }),
  {
    description: 'Categories data',
  },
)

export type GetCategoriesResponse = z.infer<typeof GetCategoriesResponse>

// ============= Check Category Exists =============

/**
 * Check category exists request
 */
export const CheckCategoryExistsRequest = openapi(
  z.object({
    categoryId: UUID,
  }),
  {
    description: 'Check if category exists and is active',
  },
)

export type CheckCategoryExistsRequest = z.infer<
  typeof CheckCategoryExistsRequest
>

/**
 * Check category exists response
 */
export const CheckCategoryExistsResponse = openapi(
  z.object({
    exists: z.boolean(),
    isActive: z.boolean().optional(),
  }),
  {
    description: 'Category exists result',
  },
)

export type CheckCategoryExistsResponse = z.infer<
  typeof CheckCategoryExistsResponse
>

import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Category-specific parameter schemas
 */

// ============= Category Parameters =============

/**
 * Category path parameters schema (raw Zod)
 * Used for validation in routes
 */
export const CategoryPathParams = z.object({
  id: UUID.describe('Category ID'),
})

export type CategoryPathParams = z.infer<typeof CategoryPathParams>

/**
 * Category ID path parameter (OpenAPI)
 * Used in: GET /categories/{id}, PATCH /categories/{id}, etc.
 */
export const CategoryIdParam = openapi(CategoryPathParams, {
  description: 'Category ID path parameter',
})

export type CategoryIdParam = z.infer<typeof CategoryIdParam>

/**
 * Category ID named path parameters schema (raw Zod)
 * Used for routes with {categoryId} in path
 */
export const CategoryIdNamedPathParams = z.object({
  categoryId: UUID.describe('Category ID'),
})

export type CategoryIdNamedPathParams = z.infer<
  typeof CategoryIdNamedPathParams
>

/**
 * Category ID path parameter with categoryId name (OpenAPI)
 * Used in: GET /categories/{categoryId}/businesses
 */
export const CategoryIdNamedParam = openapi(CategoryIdNamedPathParams, {
  description: 'Category ID path parameter (named categoryId)',
})

export type CategoryIdNamedParam = z.infer<typeof CategoryIdNamedParam>

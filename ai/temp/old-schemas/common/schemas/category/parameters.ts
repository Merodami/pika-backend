import { z } from 'zod'
import { UUID } from '../primitives.js'
import { openapi } from '../../utils/openapi.js'

/**
 * Category-specific parameter schemas
 */

/**
 * Category ID path parameter
 */
export const CategoryIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Category ID path parameter',
  },
)

export type CategoryIdParam = z.infer<typeof CategoryIdParam>

/**
 * Category path parameters (for routes like /categories/:id/path)
 */
export const CategoryPathParams = CategoryIdParam

export type CategoryPathParams = z.infer<typeof CategoryPathParams>

/**
 * Category hierarchy query parameters
 */
export const CategoryHierarchyQuery = openapi(
  z.object({
    rootId: UUID.optional().describe('Root category ID for hierarchy'),
  }),
  {
    description: 'Category hierarchy query parameters',
  },
)

export type CategoryHierarchyQuery = z.infer<typeof CategoryHierarchyQuery>

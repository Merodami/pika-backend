import { z } from 'zod'

import { UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Reusable parameter schemas for stuff/equipment API endpoints
 */

/**
 * Category ID path parameter
 */
export const CategoryIdParam = openapi(
  z.object({
    id: z.string(),
  }),
  {
    description: 'Equipment category ID path parameter',
  },
)

export type CategoryIdParam = z.infer<typeof CategoryIdParam>

/**
 * Stuff ID path parameter
 */
export const StuffIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Stuff/equipment ID path parameter',
  },
)

export type StuffIdParam = z.infer<typeof StuffIdParam>

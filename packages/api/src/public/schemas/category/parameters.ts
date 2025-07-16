import { z } from 'zod'

import { UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Path parameters for category endpoints
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
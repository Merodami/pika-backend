import { z } from 'zod'

import { UUID } from '../../shared/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Business-specific path parameter schemas
 */

/**
 * Business ID path parameter
 */
export const BusinessIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Business ID path parameter',
  },
)

export type BusinessIdParam = z.infer<typeof BusinessIdParam>

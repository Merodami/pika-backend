import { z } from 'zod'

import { UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Reusable parameter schemas for user API endpoints
 */

/**
 * Address ID path parameter
 */
export const AddressIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Address ID path parameter',
  },
)

export type AddressIdParam = z.infer<typeof AddressIdParam>

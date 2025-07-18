import { z } from 'zod'

import { UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Path parameters for subscription endpoints
 */

/**
 * Subscription plan ID path parameter
 */
export const PlanIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Subscription plan ID path parameter',
  },
)

export type PlanIdParam = z.infer<typeof PlanIdParam>

/**
 * Subscription ID path parameter
 */
export const SubscriptionIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Subscription ID path parameter',
  },
)

export type SubscriptionIdParam = z.infer<typeof SubscriptionIdParam>

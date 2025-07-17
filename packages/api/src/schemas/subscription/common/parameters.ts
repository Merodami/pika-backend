import { z } from 'zod'
import { UUID } from '@pika/api/common'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Subscription service path parameters
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

export const SubscriptionIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Subscription ID path parameter',
  },
)
export type SubscriptionIdParam = z.infer<typeof SubscriptionIdParam>
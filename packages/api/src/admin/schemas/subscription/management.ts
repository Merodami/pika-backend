import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Admin subscription management schemas
 */

// ============= Enums =============

export const SubscriptionStatus = z.enum([
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'TRIALING',
  'UNPAID',
])

export const SubscriptionInterval = z.enum(['MONTHLY', 'YEARLY'])

// ============= Query Parameters =============

/**
 * Admin get subscriptions query parameters
 */
export const AdminGetSubscriptionsQuery = openapi(
  z.object({
    userId: UserId.optional(),
    status: SubscriptionStatus.optional(),
    interval: SubscriptionInterval.optional(),
    planId: UUID.optional(),
    cancelAtPeriodEnd: z.coerce.boolean().optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'currentPeriodEnd'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  {
    description: 'Query parameters for admin subscription listing',
  },
)

export type AdminGetSubscriptionsQuery = z.infer<
  typeof AdminGetSubscriptionsQuery
>

// ============= Path Parameters =============

/**
 * Subscription ID parameter
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

// ============= Request Bodies =============

/**
 * Process subscription credits request
 */
export const ProcessSubscriptionCreditsRequest = openapi(
  z.object({
    force: z
      .boolean()
      .default(false)
      .describe('Force processing even if already processed'),
    dryRun: z
      .boolean()
      .default(false)
      .describe('Simulate processing without making changes'),
  }),
  {
    description: 'Process monthly credits for a subscription',
  },
)

export type ProcessSubscriptionCreditsRequest = z.infer<
  typeof ProcessSubscriptionCreditsRequest
>

import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import {
  BillingInterval,
  SubscriptionSortBy,
  SubscriptionStatus,
} from '../common/enums.js'

/**
 * Admin subscription management schemas
 */

// ============= Query Parameters =============

/**
 * Admin get subscriptions query parameters
 */
export const AdminGetSubscriptionsQuery = openapi(
  SearchParams.extend({
    userId: UserId.optional(),
    status: SubscriptionStatus.optional(),
    interval: BillingInterval.optional(),
    planId: UUID.optional(),
    cancelAtPeriodEnd: z.coerce.boolean().optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    sortBy: SubscriptionSortBy.default('createdAt'),
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

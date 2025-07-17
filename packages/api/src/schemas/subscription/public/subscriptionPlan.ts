import { z } from 'zod'

import {
  activeStatus,
  withTimestamps,
} from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Subscription plan schemas for public API
 */

// ============= Enums =============

export const SubscriptionInterval = z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR'])
export type SubscriptionInterval = z.infer<typeof SubscriptionInterval>

// ============= Subscription Plan =============

/**
 * Subscription plan
 */
export const SubscriptionPlan = openapi(
  withTimestamps({
    id: UUID,
    name: z.string().describe('Name of the subscription plan'),
    description: z
      .string()
      .optional()
      .describe('Description of the subscription plan'),
    price: z.number().nonnegative().describe('Price per billing period'),
    currency: z
      .string()
      .length(3)
      .default('usd')
      .describe('Currency code (e.g., usd, gbp)'),
    interval: SubscriptionInterval,
    intervalCount: z
      .number()
      .int()
      .positive()
      .default(1)
      .describe('Number of intervals between billings'),
    creditsAmount: z
      .number()
      .int()
      .nonnegative()
      .describe('Credits granted per billing period'),
    trialPeriodDays: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Number of trial days'),
    features: z.array(z.string()).describe('Array of feature descriptions'),
    metadata: z.record(z.any()).optional().describe('Additional configuration'),
    stripeProductId: z.string().optional().describe('Stripe product ID'),
    stripePriceId: z.string().optional().describe('Stripe price ID'),
  }).merge(activeStatus),
  {
    description: 'Subscription plan details',
  },
)

export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>

// ============= Create Plan =============

/**
 * Create subscription plan request
 */
export const CreateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    currency: z.string().length(3).default('usd'),
    interval: SubscriptionInterval,
    intervalCount: z.number().int().positive().default(1),
    creditsAmount: z.number().int().nonnegative(),
    trialPeriodDays: z.number().int().nonnegative().optional(),
    features: z.array(z.string()),
    metadata: z.record(z.any()).optional(),
    stripeProductId: z.string().optional(),
    stripePriceId: z.string().optional(),
  }),
  {
    description: 'Create a new subscription plan',
  },
)

export type CreateSubscriptionPlanRequest = z.infer<
  typeof CreateSubscriptionPlanRequest
>

// ============= Update Plan =============

/**
 * Update subscription plan request
 */
export const UpdateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().nonnegative().optional(),
    creditsAmount: z.number().int().nonnegative().optional(),
    trialPeriodDays: z.number().int().nonnegative().optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
    stripePriceId: z.string().optional(),
  }),
  {
    description: 'Update a subscription plan',
  },
)

export type UpdateSubscriptionPlanRequest = z.infer<
  typeof UpdateSubscriptionPlanRequest
>

// ============= Search Plans =============

/**
 * Subscription plan query parameters
 */
export const SubscriptionPlanQueryParams = z.object({
  isActive: z.coerce.boolean().optional(),
  membershipType: z.string().optional().describe('Filter by membership type'),
  membershipPackage: z
    .string()
    .optional()
    .describe('Filter by membership package'),
  interval: SubscriptionInterval.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type SubscriptionPlanQueryParams = z.infer<
  typeof SubscriptionPlanQueryParams
>

/**
 * Subscription plan list response
 */
export const SubscriptionPlanListResponse = paginatedResponse(SubscriptionPlan)

export type SubscriptionPlanListResponse = z.infer<
  typeof SubscriptionPlanListResponse
>

/**
 * Single subscription plan response
 */
export const SubscriptionPlanDetailResponse = openapi(SubscriptionPlan, {
  description: 'Single subscription plan details',
})

export type SubscriptionPlanDetailResponse = z.infer<
  typeof SubscriptionPlanDetailResponse
>

import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { openapi } from '../../../common/utils/openapi.js'
import { SubscriptionPlan } from './subscriptionPlan.js'

/**
 * Subscription schemas for public API
 */

// ============= Enums =============

export const SubscriptionStatusEnum = z.enum([
  'ACTIVE',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'PAST_DUE',
  'TRIALING',
  'UNPAID',
])
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>

// ============= Subscription =============

/**
 * Subscription
 */
export const Subscription = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    planId: UUID.optional(),
    planType: z.string().describe('Plan type (for backward compatibility)'),
    status: SubscriptionStatusEnum,
    billingInterval: z
      .string()
      .describe('Billing interval (for backward compatibility)'),
    currentPeriodStart: DateTime.optional().describe(
      'Current billing period start date',
    ),
    currentPeriodEnd: DateTime.optional().describe(
      'Current billing period end date',
    ),
    trialEnd: DateTime.optional().describe('Trial end date'),
    cancelAtPeriodEnd: z
      .boolean()
      .default(false)
      .describe('Whether to cancel at period end'),
    stripeCustomerId: z.string().optional().describe('Stripe customer ID'),
    stripeSubscriptionId: z
      .string()
      .optional()
      .describe('Stripe subscription ID'),
    stripePriceId: z.string().optional().describe('Stripe price ID'),
    startDate: DateTime.optional().describe('Subscription start date'),
    endDate: DateTime.optional().describe('Subscription end date'),
    lastProcessedAt: DateTime.optional().describe(
      'Last credit processing date',
    ),
    cancelledAt: DateTime.optional().describe('Cancellation date'),
  }),
  {
    description: 'Subscription details',
  },
)

export type Subscription = z.infer<typeof Subscription>

/**
 * Subscription with plan details
 */
export const SubscriptionWithPlan = Subscription.extend({
  plan: SubscriptionPlan.optional(),
})

export type SubscriptionWithPlan = z.infer<typeof SubscriptionWithPlan>

// ============= Create Subscription =============

/**
 * Create subscription request
 */
export const CreateSubscriptionRequest = openapi(
  z.object({
    planId: UUID,
    stripeCustomerId: z.string().optional(),
    trialEnd: DateTime.optional(),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Create a new subscription',
  },
)

export type CreateSubscriptionRequest = z.infer<
  typeof CreateSubscriptionRequest
>

// ============= Update Subscription =============

/**
 * Update subscription request
 */
export const UpdateSubscriptionRequest = openapi(
  z.object({
    planId: UUID.optional(),
    status: SubscriptionStatusEnum.optional(),
    currentPeriodStart: DateTime.optional(),
    currentPeriodEnd: DateTime.optional(),
    trialEnd: DateTime.optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    cancelledAt: DateTime.optional(),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Update a subscription',
  },
)

export type UpdateSubscriptionRequest = z.infer<
  typeof UpdateSubscriptionRequest
>

// ============= Cancel Subscription =============

/**
 * Cancel subscription request
 */
export const CancelSubscriptionRequest = openapi(
  z.object({
    cancelAtPeriodEnd: z
      .boolean()
      .default(true)
      .describe('Whether to cancel at period end'),
    reason: z.string().optional().describe('Cancellation reason'),
    feedback: z.string().optional().describe('User feedback'),
  }),
  {
    description: 'Cancel a subscription',
  },
)

export type CancelSubscriptionRequest = z.infer<
  typeof CancelSubscriptionRequest
>

// ============= Process Credits =============

/**
 * Process subscription credits request
 */
export const ProcessSubscriptionCreditsRequest = openapi(
  z.object({
    subscriptionId: UUID,
  }),
  {
    description: 'Process subscription credits',
  },
)

export type ProcessSubscriptionCreditsRequest = z.infer<
  typeof ProcessSubscriptionCreditsRequest
>

/**
 * Credit processing response
 */
export const CreditProcessingResponse = openapi(
  z.object({
    subscription: Subscription,
    creditsAdded: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of credits added'),
    newBalance: z.number().int().nonnegative().describe('New credit balance'),
  }),
  {
    description: 'Response for credit processing',
  },
)

export type CreditProcessingResponse = z.infer<typeof CreditProcessingResponse>

// ============= Search Subscriptions =============

/**
 * Subscription query parameters
 */
export const SubscriptionQueryParams = z.object({
  status: SubscriptionStatusEnum.optional(),
  userId: UserId.optional(),
  planId: UUID.optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export type SubscriptionQueryParams = z.infer<typeof SubscriptionQueryParams>

/**
 * Subscription list response
 */
export const SubscriptionListResponse = paginatedResponse(SubscriptionWithPlan)

export type SubscriptionListResponse = z.infer<typeof SubscriptionListResponse>

/**
 * Single subscription response
 */
export const SubscriptionResponse = openapi(SubscriptionWithPlan, {
  description: 'Single subscription with plan details',
})

export type SubscriptionResponse = z.infer<typeof SubscriptionResponse>

// ============= Subscription Management =============

/**
 * Resume subscription request
 */
export const ResumeSubscriptionRequest = openapi(
  z.object({
    resumeImmediately: z
      .boolean()
      .default(true)
      .describe('Resume immediately or at period end'),
  }),
  {
    description: 'Resume a cancelled subscription',
  },
)

export type ResumeSubscriptionRequest = z.infer<
  typeof ResumeSubscriptionRequest
>

/**
 * Change subscription plan request
 */
export const ChangeSubscriptionPlanRequest = openapi(
  z.object({
    newPlanId: UUID,
    prorate: z
      .boolean()
      .default(true)
      .describe('Whether to prorate the change'),
    changeImmediately: z
      .boolean()
      .default(true)
      .describe('Change immediately or at period end'),
  }),
  {
    description: 'Change subscription plan',
  },
)

export type ChangeSubscriptionPlanRequest = z.infer<
  typeof ChangeSubscriptionPlanRequest
>

// ============= Usage and Billing =============

/**
 * Subscription usage
 */
export const SubscriptionUsage = openapi(
  z.object({
    subscriptionId: UUID,
    periodStart: DateTime,
    periodEnd: DateTime,
    creditsUsed: z.number().int().nonnegative(),
    creditsRemaining: z.number().int().nonnegative(),
    creditsTotal: z.number().int().nonnegative(),
    usageByCategory: z.record(z.number().int().nonnegative()).optional(),
  }),
  {
    description: 'Subscription usage information',
  },
)

export type SubscriptionUsage = z.infer<typeof SubscriptionUsage>

/**
 * Upcoming invoice
 */
export const UpcomingInvoice = openapi(
  z.object({
    amountDue: z.number().nonnegative(),
    currency: z.string().length(3),
    dueDate: DateTime,
    lineItems: z.array(
      z.object({
        description: z.string(),
        amount: z.number(),
        quantity: z.number().int().positive().optional(),
      }),
    ),
  }),
  {
    description: 'Upcoming invoice details',
  },
)

export type UpcomingInvoice = z.infer<typeof UpcomingInvoice>

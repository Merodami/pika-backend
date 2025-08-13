import { SubscriptionSortBy } from '@pika/types'
import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  SubscriptionSortBySchema,
  SubscriptionStatusSchema,
} from '../common/enums.js'
import { SubscriptionPlan } from './subscriptionPlan.js'

/**
 * Subscription schemas for public API
 */

// Re-export common types for backward compatibility
export { CancelSubscriptionRequest } from '../common/types.js'

// Enums are now imported from common/

// ============= Subscription =============

/**
 * Subscription (raw Zod)
 */
export const Subscription = withTimestamps({
  id: UUID,
  userId: UserId,
  planId: UUID.optional(),
  planType: z.string().describe('Plan type (for backward compatibility)'),
  status: SubscriptionStatusSchema,
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
})

/**
 * Subscription (OpenAPI documented)
 */
export const SubscriptionSchema = Subscription.openapi('Subscription', {
  description: 'Subscription details',
})

export type Subscription = z.infer<typeof Subscription>

/**
 * Subscription with plan details (raw Zod)
 */
export const SubscriptionWithPlan = Subscription.extend({
  plan: SubscriptionPlan.optional(),
})

/**
 * Subscription with plan details (OpenAPI documented)
 */
export const SubscriptionWithPlanSchema = SubscriptionWithPlan.openapi('SubscriptionWithPlan', {
  description: 'Subscription with plan details',
})

export type SubscriptionWithPlan = z.infer<typeof SubscriptionWithPlan>

// ============= Create Subscription =============

/**
 * Create subscription request (raw Zod)
 */
export const CreateSubscriptionRequest = z.object({
  planId: UUID,
  stripeCustomerId: z.string().optional(),
  trialEnd: DateTime.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Create subscription request (OpenAPI documented)
 */
export const CreateSubscriptionRequestSchema = CreateSubscriptionRequest.openapi('CreateSubscriptionRequest', {
  description: 'Create a new subscription',
})

export type CreateSubscriptionRequest = z.infer<
  typeof CreateSubscriptionRequest
>

// ============= Update Subscription =============

/**
 * Update subscription request (raw Zod)
 */
export const UpdateSubscriptionRequest = z.object({
  planId: UUID.optional(),
  status: SubscriptionStatusSchema.optional(),
  currentPeriodStart: DateTime.optional(),
  currentPeriodEnd: DateTime.optional(),
  trialEnd: DateTime.optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  cancelledAt: DateTime.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Update subscription request (OpenAPI documented)
 */
export const UpdateSubscriptionRequestSchema = UpdateSubscriptionRequest.openapi('UpdateSubscriptionRequest', {
  description: 'Update a subscription',
})

export type UpdateSubscriptionRequest = z.infer<
  typeof UpdateSubscriptionRequest
>

// ============= Search Subscriptions =============

/**
 * Subscription query parameters (raw Zod)
 */
export const SubscriptionQueryParams = SearchParams.extend({
  status: SubscriptionStatusSchema.optional(),
  userId: UserId.optional(),
  planId: UUID.optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  sortBy: SubscriptionSortBySchema.default(SubscriptionSortBy.CREATED_AT),
})

/**
 * Subscription query parameters (OpenAPI documented)
 */
export const SubscriptionQueryParamsSchema = SubscriptionQueryParams.openapi('SubscriptionQueryParams', {
  description: 'Subscription search and filter parameters',
})

export type SubscriptionQueryParams = z.infer<typeof SubscriptionQueryParams>

/**
 * Subscription list response (raw Zod)
 */
export const SubscriptionListResponse = paginatedResponse(SubscriptionWithPlan)

/**
 * Subscription list response (OpenAPI documented)
 */
export const SubscriptionListResponseSchema = SubscriptionListResponse.openapi('SubscriptionListResponse', {
  description: 'Paginated list of subscriptions',
})

export type SubscriptionListResponse = z.infer<typeof SubscriptionListResponse>

/**
 * Single subscription response (raw Zod)
 */
export const SubscriptionResponse = SubscriptionWithPlan

/**
 * Single subscription response (OpenAPI documented)
 */
export const SubscriptionResponseSchema = SubscriptionResponse.openapi('SubscriptionResponse', {
  description: 'Single subscription with plan details',
})

export type SubscriptionResponse = z.infer<typeof SubscriptionResponse>

// ============= Subscription Management =============

/**
 * Resume subscription request (raw Zod)
 */
export const ResumeSubscriptionRequest = z.object({
  resumeImmediately: z
    .boolean()
    .default(true)
    .describe('Resume immediately or at period end'),
})

/**
 * Resume subscription request (OpenAPI documented)
 */
export const ResumeSubscriptionRequestSchema = ResumeSubscriptionRequest.openapi('ResumeSubscriptionRequest', {
  description: 'Resume a cancelled subscription',
})

export type ResumeSubscriptionRequest = z.infer<
  typeof ResumeSubscriptionRequest
>

/**
 * Change subscription plan request (raw Zod)
 */
export const ChangeSubscriptionPlanRequest = z.object({
  newPlanId: UUID,
  prorate: z
    .boolean()
    .default(true)
    .describe('Whether to prorate the change'),
  changeImmediately: z
    .boolean()
    .default(true)
    .describe('Change immediately or at period end'),
})

/**
 * Change subscription plan request (OpenAPI documented)
 */
export const ChangeSubscriptionPlanRequestSchema = ChangeSubscriptionPlanRequest.openapi('ChangeSubscriptionPlanRequest', {
  description: 'Change subscription plan',
})

export type ChangeSubscriptionPlanRequest = z.infer<
  typeof ChangeSubscriptionPlanRequest
>

// ============= Usage and Billing =============

/**
 * Subscription usage (raw Zod)
 */
export const SubscriptionUsage = z.object({
  subscriptionId: UUID,
  periodStart: DateTime,
  periodEnd: DateTime,
  usageByCategory: z
    .record(z.string(), z.number().int().nonnegative())
    .optional(),
})

/**
 * Subscription usage (OpenAPI documented)
 */
export const SubscriptionUsageSchema = SubscriptionUsage.openapi('SubscriptionUsage', {
  description: 'Subscription usage information',
})

export type SubscriptionUsage = z.infer<typeof SubscriptionUsage>

/**
 * Upcoming invoice (raw Zod)
 */
export const UpcomingInvoice = z.object({
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
})

/**
 * Upcoming invoice (OpenAPI documented)
 */
export const UpcomingInvoiceSchema = UpcomingInvoice.openapi('UpcomingInvoice', {
  description: 'Upcoming invoice details',
})

export type UpcomingInvoice = z.infer<typeof UpcomingInvoice>

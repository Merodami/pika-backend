import { PlanSortBy } from '@pika/types'
import { z } from 'zod'

import { activeStatus, withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  BillingIntervalSchema,
  PlanSortBySchema,
  PlanTypeSchema,
} from '../common/enums.js'

/**
 * Subscription plan schemas for public API
 */

// ============= Subscription Plan =============

/**
 * Subscription plan (raw Zod)
 */
export const SubscriptionPlan = withTimestamps({
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
  interval: BillingIntervalSchema,
  intervalCount: z
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Number of intervals between billings'),
  trialPeriodDays: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Number of trial days'),
  features: z.array(z.string()).describe('Array of feature descriptions'),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe('Additional configuration'),
  stripeProductId: z.string().optional().describe('Stripe product ID'),
  stripePriceId: z.string().optional().describe('Stripe price ID'),
}).merge(activeStatus)

/**
 * Subscription plan (OpenAPI documented)
 */
export const SubscriptionPlanSchema = SubscriptionPlan.openapi('SubscriptionPlan', {
  description: 'Subscription plan details',
})

export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>

// ============= Create Plan =============

/**
 * Create subscription plan request (raw Zod)
 */
export const CreateSubscriptionPlanRequest = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default('usd'),
  interval: BillingIntervalSchema,
  intervalCount: z.number().int().positive().default(1),
  trialPeriodDays: z.number().int().nonnegative().optional(),
  features: z.array(z.string()),
  metadata: z.record(z.string(), z.any()).optional(),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional(),
})

/**
 * Create subscription plan request (OpenAPI documented)
 */
export const CreateSubscriptionPlanRequestSchema = CreateSubscriptionPlanRequest.openapi('CreateSubscriptionPlanRequest', {
  description: 'Create a new subscription plan',
})

export type CreateSubscriptionPlanRequest = z.infer<
  typeof CreateSubscriptionPlanRequest
>

// ============= Update Plan =============

/**
 * Update subscription plan request (raw Zod)
 */
export const UpdateSubscriptionPlanRequest = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  trialPeriodDays: z.number().int().nonnegative().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  stripePriceId: z.string().optional(),
})

/**
 * Update subscription plan request (OpenAPI documented)
 */
export const UpdateSubscriptionPlanRequestSchema = UpdateSubscriptionPlanRequest.openapi('UpdateSubscriptionPlanRequest', {
  description: 'Update a subscription plan',
})

export type UpdateSubscriptionPlanRequest = z.infer<
  typeof UpdateSubscriptionPlanRequest
>

/**
 * Plan sync success response (raw Zod)
 */
export const PlanSyncResponse = z.object({
  message: z.string(),
})

/**
 * Plan sync success response (OpenAPI documented)
 */
export const PlanSyncResponseSchema = PlanSyncResponse.openapi('PlanSyncResponse', {
  description: 'Plan sync success response',
})

export type PlanSyncResponse = z.infer<typeof PlanSyncResponse>

// ============= Search Plans =============

/**
 * Subscription plan query parameters (raw Zod)
 */
export const SubscriptionPlanQueryParams = SearchParams.extend({
  isActive: z.coerce.boolean().optional(),
  interval: BillingIntervalSchema.optional(),
  planType: PlanTypeSchema.optional(),
  sortBy: PlanSortBySchema.default(PlanSortBy.NAME),
})

/**
 * Subscription plan query parameters (OpenAPI documented)
 */
export const SubscriptionPlanQueryParamsSchema = SubscriptionPlanQueryParams.openapi('SubscriptionPlanQueryParams', {
  description: 'Subscription plan search and filter parameters',
})

export type SubscriptionPlanQueryParams = z.infer<
  typeof SubscriptionPlanQueryParams
>

/**
 * Subscription plan list response (raw Zod)
 */
export const SubscriptionPlanListResponse = paginatedResponse(SubscriptionPlan)

/**
 * Subscription plan list response (OpenAPI documented)
 */
export const SubscriptionPlanListResponseSchema = SubscriptionPlanListResponse.openapi('SubscriptionPlanListResponse', {
  description: 'Paginated list of subscription plans',
})

export type SubscriptionPlanListResponse = z.infer<
  typeof SubscriptionPlanListResponse
>

/**
 * Single subscription plan response (raw Zod)
 */
export const SubscriptionPlanDetailResponse = SubscriptionPlan

/**
 * Single subscription plan response (OpenAPI documented)
 */
export const SubscriptionPlanDetailResponseSchema = SubscriptionPlanDetailResponse.openapi('SubscriptionPlanDetailResponse', {
  description: 'Single subscription plan details',
})

export type SubscriptionPlanDetailResponse = z.infer<
  typeof SubscriptionPlanDetailResponse
>

import { z } from 'zod'

/**
 * Subscription service enums
 */

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

export const BillingInterval = z.enum(['MONTHLY', 'YEARLY', 'WEEKLY'])
export type BillingInterval = z.infer<typeof BillingInterval>

export const PlanType = z.enum(['BASIC', 'PREMIUM', 'ENTERPRISE', 'TRIAL'])
export type PlanType = z.infer<typeof PlanType>
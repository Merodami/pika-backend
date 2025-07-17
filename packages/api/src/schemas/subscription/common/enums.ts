import { z } from 'zod'

/**
 * Subscription-specific enums
 */

// ============= Subscription Enums =============

export const SubscriptionStatus = z.enum([
  'active',
  'canceled',
  'incomplete',
  'incompleteExpired',
  'pastDue',
  'trialing',
  'unpaid',
])

export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>

export const BillingInterval = z.enum([
  'day',
  'week',
  'month',
  'year',
])

export type BillingInterval = z.infer<typeof BillingInterval>

export const PlanType = z.enum([
  'basic',
  'premium',
  'enterprise',
  'trial',
])

export type PlanType = z.infer<typeof PlanType>

export const SubscriptionSortBy = z.enum([
  'createdAt',
  'updatedAt',
  'startDate',
  'endDate',
  'status',
])

export type SubscriptionSortBy = z.infer<typeof SubscriptionSortBy>

export const PlanSortBy = z.enum([
  'name',
  'price',
  'createdAt',
  'updatedAt',
])

export type PlanSortBy = z.infer<typeof PlanSortBy>

// ============= Internal Service Enums =============

export const SubscriptionEvent = z.enum([
  'created',
  'updated',
  'canceled',
  'reactivated',
  'expired',
  'paymentFailed',
  'paymentSucceeded',
])

export type SubscriptionEvent = z.infer<typeof SubscriptionEvent>

export const UsageType = z.enum([
  'featureAccess',
  'apiCall',
  'storage',
  'bandwidth',
])

export type UsageType = z.infer<typeof UsageType>

// ============= Admin Enums =============

export const BulkAction = z.enum([
  'cancel',
  'suspend',
  'reactivate',
])

export type BulkAction = z.infer<typeof BulkAction>
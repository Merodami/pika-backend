/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Subscription details
 */
export type Subscription = {
  /**
   * Universally Unique Identifier
   */
  id: string
  userId: string
  /**
   * Universally Unique Identifier
   */
  planId?: string
  /**
   * Plan type (for backward compatibility)
   */
  planType: string
  status:
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incompleteExpired'
    | 'pastDue'
    | 'trialing'
    | 'unpaid'
  /**
   * Billing interval (for backward compatibility)
   */
  billingInterval: string
  /**
   * Current billing period start date
   */
  currentPeriodStart?: string
  /**
   * Current billing period end date
   */
  currentPeriodEnd?: string
  /**
   * Trial end date
   */
  trialEnd?: string
  /**
   * Whether to cancel at period end
   */
  cancelAtPeriodEnd?: boolean
  /**
   * Stripe customer ID
   */
  stripeCustomerId?: string
  /**
   * Stripe subscription ID
   */
  stripeSubscriptionId?: string
  /**
   * Stripe price ID
   */
  stripePriceId?: string
  /**
   * Subscription start date
   */
  startDate?: string
  /**
   * Subscription end date
   */
  endDate?: string
  /**
   * Last credit processing date
   */
  lastProcessedAt?: string
  /**
   * Cancellation date
   */
  cancelledAt?: string
  /**
   * When the record was created
   */
  createdAt: string
  /**
   * When the record was last updated
   */
  updatedAt: string
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Update subscription from payment service
 */
export type UpdateStripeSubscriptionRequest = {
  stripeSubscriptionId: string
  status:
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incompleteExpired'
    | 'pastDue'
    | 'trialing'
    | 'unpaid'
  /**
   * ISO 8601 datetime with timezone
   */
  currentPeriodStart?: string
  /**
   * ISO 8601 datetime with timezone
   */
  currentPeriodEnd?: string
  /**
   * ISO 8601 datetime with timezone
   */
  canceledAt?: string
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, any>
}

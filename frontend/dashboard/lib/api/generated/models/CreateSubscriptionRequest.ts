/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Create a new subscription
 */
export type CreateSubscriptionRequest = {
  /**
   * Universally Unique Identifier
   */
  planId: string
  stripeCustomerId?: string
  /**
   * ISO 8601 datetime with timezone
   */
  trialEnd?: string
  metadata?: Record<string, any>
}

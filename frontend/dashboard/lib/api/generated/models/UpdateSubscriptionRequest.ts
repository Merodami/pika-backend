/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Update a subscription
 */
export type UpdateSubscriptionRequest = {
  /**
   * Universally Unique Identifier
   */
  planId?: string
  status?:
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
  trialEnd?: string
  cancelAtPeriodEnd?: boolean
  /**
   * ISO 8601 datetime with timezone
   */
  cancelledAt?: string
  metadata?: Record<string, any>
}

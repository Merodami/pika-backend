/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Internal subscription data
 */
export type StripeSubscriptionResponse = {
  /**
   * Universally Unique Identifier
   */
  id: string
  userId: string
  stripeSubscriptionId: string
  /**
   * Universally Unique Identifier
   */
  planId: string
  planName: string
  status: string
  /**
   * ISO 8601 datetime with timezone
   */
  currentPeriodStart?: string
  /**
   * ISO 8601 datetime with timezone
   */
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  /**
   * ISO 8601 datetime with timezone
   */
  createdAt: string
  /**
   * ISO 8601 datetime with timezone
   */
  updatedAt: string
}

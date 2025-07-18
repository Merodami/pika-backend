/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Process subscription usage
 */
export type ProcessSubscriptionUsageRequest = {
  userId: string
  /**
   * Universally Unique Identifier
   */
  subscriptionId: string
  usageType: 'featureAccess' | 'creditDeduction'
  amount?: number
  metadata?: Record<string, any>
}

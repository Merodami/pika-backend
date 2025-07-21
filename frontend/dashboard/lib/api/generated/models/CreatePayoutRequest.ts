/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Process pending payouts
 */
export type CreatePayoutRequest = {
  payoutIds: Array<string>
  action: 'approve' | 'reject' | 'delay'
  reason?: string
  /**
   * ISO 8601 datetime with timezone
   */
  delayUntil?: string
}

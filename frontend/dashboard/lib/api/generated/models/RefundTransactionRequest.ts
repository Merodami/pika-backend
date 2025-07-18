/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Refund a transaction
 */
export type RefundTransactionRequest = {
  /**
   * Partial refund amount
   */
  amount?: number
  reason: 'duplicate' | 'fraudulent' | 'customerRequest' | 'other'
  description: string
  notifyUser?: boolean
}

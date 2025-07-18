/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Financial summary for a period
 */
export type PaymentStatsResponse = {
  period: {
    /**
     * ISO 8601 datetime with timezone
     */
    start: string
    /**
     * ISO 8601 datetime with timezone
     */
    end: string
  }
  totalRevenue: number
  totalRefunds: number
  totalFees: number
  netRevenue: number
  /**
   * Revenue by transaction type (all keys optional)
   */
  revenueByType: {
    payment?: number
    refund?: number
    transfer?: number
    payout?: number
    adjustment?: number
  }
  /**
   * Revenue by payment method (all keys optional)
   */
  revenueByPaymentMethod: {
    card?: number
    bankTransfer?: number
    wallet?: number
    cash?: number
  }
  transactionCount: number
  successfulCount: number
  failedCount: number
  disputeCount: number
  averageTransactionAmount: number
  topBusinesses?: Array<{
    /**
     * Universally Unique Identifier
     */
    businessId: string
    businessName: string
    revenue: number
    transactionCount: number
  }>
  topUsers?: Array<{
    userId: string
    userName: string
    spent: number
    transactionCount: number
  }>
}

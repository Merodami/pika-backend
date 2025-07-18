/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Detailed transaction information for admin
 */
export type AdminTransactionDetailResponse = {
  /**
   * Universally Unique Identifier
   */
  id: string
  type: 'payment' | 'refund' | 'transfer' | 'payout' | 'adjustment'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  amount: number
  currency: string
  fee?: number
  tax?: number
  netAmount: number
  userId?: string
  userName?: string
  /**
   * Universally Unique Identifier
   */
  businessId?: string
  businessName?: string
  paymentMethod: 'card' | 'bankTransfer' | 'wallet' | 'cash'
  stripePaymentIntentId?: string
  stripeChargeId?: string
  stripeRefundId?: string
  /**
   * Type of related entity
   */
  referenceType?: string
  /**
   * ID of related entity
   */
  referenceId?: string
  description?: string
  /**
   * ISO 8601 datetime with timezone
   */
  processedAt?: string
  failureReason?: string
  failureCode?: string
  disputeStatus?: 'warning' | 'needsResponse' | 'underReview' | 'won' | 'lost'
  disputeReason?: string
  refundReason?: string
  refundedAmount?: number
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  /**
   * When the record was created
   */
  createdAt: string
  /**
   * When the record was last updated
   */
  updatedAt: string
}

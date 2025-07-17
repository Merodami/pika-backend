import type { MultilingualContent } from '@pika/types-core'

/**
 * Simplified voucher for redemption validation
 */
export interface VoucherForRedemption {
  id: string
  providerId: string
  state: 'NEW' | 'PUBLISHED' | 'EXPIRED'
  title: MultilingualContent
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  currency: string
  expiresAt: Date
  maxRedemptions?: number
  maxRedemptionsPerUser: number
  currentRedemptions: number
  provider: {
    id: string
    name: string
  }
}

/**
 * Port interface for voucher read operations needed by redemption service
 */
export interface VoucherReadRepositoryPort {
  /**
   * Get voucher by ID for redemption validation
   */
  getVoucherForRedemption(
    voucherId: string,
  ): Promise<VoucherForRedemption | null>

  /**
   * Check if voucher is valid for redemption
   */
  isVoucherRedeemable(voucherId: string): Promise<boolean>
}

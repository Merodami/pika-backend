import type { Redemption } from '@redemption-write/domain/entities/Redemption.js'

/**
 * Port interface for redemption write operations
 */
export interface RedemptionWriteRepositoryPort {
  /**
   * Record a new redemption
   */
  recordRedemption(
    redemption: Omit<Redemption, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Redemption>

  /**
   * Check if a redemption exists for a voucher and customer
   */
  checkRedemptionExists(voucherId: string, customerId: string): Promise<boolean>

  /**
   * Get redemption by code (for duplicate checking)
   */
  getRedemptionByCode(code: string): Promise<Redemption | null>

  /**
   * Count redemptions for a voucher
   */
  countVoucherRedemptions(voucherId: string): Promise<number>

  /**
   * Count redemptions for a voucher by a specific customer
   */
  countCustomerVoucherRedemptions(
    voucherId: string,
    customerId: string,
  ): Promise<number>

  /**
   * Update redemption sync status
   */
  updateRedemptionSyncStatus(
    redemptionId: string,
    syncedAt: Date,
  ): Promise<void>

  /**
   * Batch insert offline redemptions
   */
  batchInsertRedemptions(
    redemptions: Array<Omit<Redemption, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Redemption[]>
}

import type { PaginatedResult } from '@pika/types-core'
import type { Redemption } from '@redemption-read/domain/entities/Redemption.js'
import type { RedemptionStats } from '@redemption-read/domain/entities/RedemptionView.js'
import type { RedemptionSearchQuery } from '@redemption-read/domain/queries/RedemptionQuery.js'

export type { RedemptionSearchQuery }

/**
 * Port interface for redemption read operations
 */
export interface RedemptionReadRepositoryPort {
  /**
   * Get redemption by ID
   */
  getRedemptionById(id: string): Promise<Redemption | null>

  /**
   * Get all redemptions with pagination and filters
   */
  getAllRedemptions(
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>>

  /**
   * Get redemptions by provider (service provider)
   */
  getRedemptionsByProvider(
    providerId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>>

  /**
   * Get redemptions by customer
   */
  getRedemptionsByCustomer(
    customerId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>>

  /**
   * Get redemptions by voucher
   */
  getRedemptionsByVoucher(
    voucherId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>>

  /**
   * Get redemption statistics for a provider
   */
  getProviderStats(
    providerId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<RedemptionStats>

  /**
   * Get redemption statistics for a voucher
   */
  getVoucherStats(voucherId: string): Promise<RedemptionStats>
}

import type { PaginatedResult } from '@pika/types-core'
import type { GetVoucherQuery } from '@voucher-read/application/use_cases/queries/GetVoucherQuery.js'
import type { VoucherSearchQuery } from '@voucher-read/application/use_cases/queries/VoucherSearchQuery.js'
import type { Voucher } from '@voucher-read/domain/entities/Voucher.js'

/**
 * VoucherReadRepositoryPort defines the contract for voucher data access in the read model.
 * Implementations of this interface handle retrieval operations for vouchers.
 */
export interface VoucherReadRepositoryPort {
  /**
   * Retrieve all vouchers matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated voucher results
   */
  getAllVouchers(query: VoucherSearchQuery): Promise<PaginatedResult<Voucher>>

  /**
   * Retrieve a single voucher by its unique identifier
   *
   * @param query - Query parameters containing ID and optional include flags
   * @returns Promise with the voucher or null if not found
   */
  getVoucherById(query: GetVoucherQuery): Promise<Voucher | null>

  /**
   * Get vouchers by provider ID
   *
   * @param providerId - Provider's unique identifier
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated voucher results
   */
  getVouchersByProviderId(
    providerId: string,
    query: VoucherSearchQuery,
  ): Promise<PaginatedResult<Voucher>>

  /**
   * Get vouchers by user claims
   *
   * @param userId - User's unique identifier
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated voucher results
   */
  getVouchersByUserId(
    userId: string,
    query: VoucherSearchQuery,
  ): Promise<PaginatedResult<Voucher>>

  /**
   * Get multiple vouchers by their IDs
   *
   * @param voucherIds - Array of voucher IDs
   * @returns Promise with array of vouchers found
   */
  findByIds(voucherIds: string[]): Promise<any[]>
}

import type { PaginatedResult } from '@pika/types-core'

import { GetVoucherBookQuery } from '../../../application/use_cases/queries/GetVoucherBookQuery.js'
import { VoucherBookSearchQuery } from '../../../application/use_cases/queries/VoucherBookSearchQuery.js'
import { VoucherBook } from '../../entities/VoucherBook.js'

/**
 * PDFReadRepositoryPort defines the contract for PDF/VoucherBook data access in the read model.
 * Implementations of this interface handle retrieval operations for voucher books.
 */
export interface PDFReadRepositoryPort {
  /**
   * Retrieve all voucher books matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated voucher book results
   */
  getAllVoucherBooks(
    query: VoucherBookSearchQuery,
  ): Promise<PaginatedResult<VoucherBook>>

  /**
   * Retrieve a single voucher book by its unique identifier
   *
   * @param query - Query parameters containing ID and optional include flags
   * @returns Promise with the voucher book or null if not found
   */
  getVoucherBookById(query: GetVoucherBookQuery): Promise<VoucherBook | null>
}
